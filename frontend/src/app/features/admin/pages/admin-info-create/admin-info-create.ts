import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { InfoDetailsViewModel } from '../../../info/components/info-details-view/info-details-view';
import { InfoListItemView } from '../../../info/components/info-list-item/info-list-item';
import { createInfoSlug } from '../../../info/utils/info-url';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminInfoPreview } from '../../components/admin-info-preview/admin-info-preview';
import { AdminApi, CreateInfoArticleRequest } from '../../data-access/admin-api';
import { createExternalLinkControl, createInfoForm } from '../../utils/info-form';

@Component({
  selector: 'app-admin-info-create',
  imports: [AdminEditorLayout, AdminInfoPreview, ReactiveFormsModule, RouterLink, TextFieldModule],
  templateUrl: './admin-info-create.html',
  styleUrl: './admin-info-create.scss',
})
export class AdminInfoCreate {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly infoStatus = signal(0);
  readonly previewVisible = signal(true);

  readonly form = createInfoForm(this.formBuilder);

  readonly preview = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  readonly previewTitle = computed(() => this.preview().title?.trim() || 'New article title');
  readonly previewContent = computed(
    () => this.preview().content?.trim() || 'The article content will appear here as you type.',
  );
  readonly previewExternalLinks = computed(() =>
    (this.preview().externalLinks ?? [])
      .map((link) => link?.trim() ?? '')
      .filter((link) => link.length > 0),
  );
  readonly previewListItem = computed<InfoListItemView>(() => ({
    id: 'info-preview',
    title: this.previewTitle(),
    slug: this.preview().slug?.trim() || null,
    content: this.previewContent(),
    imageUrl: this.optionalText(this.preview().imageUrl),
    status: this.infoStatus(),
  }));
  readonly previewDetails = computed<InfoDetailsViewModel>(() => ({
    id: 'info-preview',
    title: this.previewTitle(),
    content: this.previewContent(),
    imageUrl: this.optionalText(this.preview().imageUrl),
    externalLinks: this.previewExternalLinks(),
  }));

  get externalLinkControls() {
    return this.form.controls.externalLinks.controls;
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  showExternalLinkError(index: number): boolean {
    const control = this.externalLinkControls[index];
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  addExternalLink(): void {
    if (this.externalLinkControls.length >= 20) {
      return;
    }
    this.form.controls.externalLinks.push(createExternalLinkControl(this.formBuilder));
  }

  removeExternalLink(index: number): void {
    this.form.controls.externalLinks.removeAt(index);
  }

  updateStatusPreview(): void {
    this.infoStatus.set(this.form.controls.status.value ?? 0);
  }

  togglePreview(): void {
    this.previewVisible.update((visible) => !visible);
  }

  onTitleInput(): void {
    if (this.form.controls.slug.dirty) {
      return;
    }
    this.form.controls.slug.setValue(createInfoSlug(this.form.controls.title.value ?? ''), {
      emitEvent: false,
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.confirmationOpen.set(true);
  }

  cancelConfirmation(): void {
    this.confirmationOpen.set(false);
  }

  confirmSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.confirmationOpen.set(false);
      return;
    }

    this.confirmationOpen.set(false);

    const value = this.form.getRawValue();
    const request: CreateInfoArticleRequest = {
      title: value.title!.trim(),
      slug: value.slug!.trim(),
      content: value.content!.trim(),
      category: value.category!.trim(),
      imageUrl: value.imageUrl!.trim(),
      externalLinks: (value.externalLinks ?? [])
        .map((link) => link?.trim() ?? '')
        .filter((link) => link.length > 0),
    };

    this.submitting.set(true);
    this.error.set(null);

    this.api.createInfo(request).pipe(
      switchMap((created) =>
        value.status === 0 ? of(created) : this.api.updateInfoStatus(created.id, value.status!),
      ),
    ).subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'info' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          response?.error?.detail ?? response?.error?.error ?? 'The info article could not be created.',
        );
      },
    });
  }

  @HostListener('document:keydown.escape')
  closeConfirmationOnEscape(): void {
    if (this.confirmationOpen() && !this.submitting()) {
      this.cancelConfirmation();
    }
  }

  private optionalText(value: string | null | undefined): string | null {
    return value?.trim() || null;
  }
}
