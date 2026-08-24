import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
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
export class AdminInfoCreate implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private objectImageUrl: string | null = null;
  private createdId: string | null = null;

  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly infoStatus = signal(0);
  readonly previewVisible = signal(true);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);

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
    imagePath: this.imagePreviewUrl(),
    status: this.infoStatus(),
  }));
  readonly previewDetails = computed<InfoDetailsViewModel>(() => ({
    id: 'info-preview',
    title: this.previewTitle(),
    content: this.previewContent(),
    imagePath: this.imagePreviewUrl(),
    externalLinks: this.previewExternalLinks(),
    status: this.infoStatus(),
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

  chooseImage(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.revokeImagePreview();
    this.selectedImage.set(null);
    this.imagePreviewUrl.set(null);
    this.imageError.set(null);

    if (!file) {
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.imageError.set('Choose a JPEG, PNG, or WebP image.');
      input.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.imageError.set('The image must be no larger than 8 MB.');
      input.value = '';
      return;
    }

    this.selectedImage.set(file);
    this.objectImageUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.objectImageUrl);
  }

  removeImage(input: HTMLInputElement): void {
    this.revokeImagePreview();
    this.selectedImage.set(null);
    this.imagePreviewUrl.set(null);
    this.imageError.set(null);
    input.value = '';
  }

  ngOnDestroy(): void {
    this.revokeImagePreview();
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
    if (this.form.invalid || this.submitting() || !this.selectedImage()) {
      this.form.markAllAsTouched();
      if (!this.selectedImage()) {
        this.imageError.set('Choose an image for this article.');
      }
      return;
    }

    this.confirmationOpen.set(true);
  }

  cancelConfirmation(): void {
    this.confirmationOpen.set(false);
  }

  confirmSubmit(): void {
    if (this.form.invalid || this.submitting() || !this.selectedImage()) {
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
      externalLinks: (value.externalLinks ?? [])
        .map((link) => link?.trim() ?? '')
        .filter((link) => link.length > 0),
    };

    this.submitting.set(true);
    this.error.set(null);

    // The status is a second request. If it fails after the create succeeded, the item
    // exists — remember its id so retrying finishes the job instead of creating a duplicate.
    const create$ = this.createdId !== null
      ? of(this.createdId)
      : this.api.createInfo(request, this.selectedImage()!).pipe(
          map((created) => {
            this.createdId = created.id;
            return created.id;
          }),
        );

    create$.pipe(
      switchMap((id) => (value.status === 0 ? of(null) : this.api.updateInfoStatus(id, value.status!))),
    ).subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'info' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          this.createdId !== null
            ? 'The info article was created but could not be published. Save again to retry publishing — this will not create a duplicate.'
            : response?.error?.detail ?? response?.error?.error ?? 'The info article could not be created.',
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

  private revokeImagePreview(): void {
    if (this.objectImageUrl) {
      URL.revokeObjectURL(this.objectImageUrl);
      this.objectImageUrl = null;
    }
  }
}
