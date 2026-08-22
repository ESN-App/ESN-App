import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { NewsDetailsViewModel } from '../../../home/components/news-details-view/news-details-view';
import { NewsListItemView } from '../../../home/components/news-list-item/news-list-item';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminNewsPreview } from '../../components/admin-news-preview/admin-news-preview';
import { AdminApi, CreateNewsItemRequest } from '../../data-access/admin-api';
import { createNewsForm } from '../../utils/news-form';

@Component({
  selector: 'app-admin-news-create',
  imports: [AdminEditorLayout, AdminNewsPreview, ReactiveFormsModule, RouterLink, TextFieldModule],
  templateUrl: './admin-news-create.html',
  styleUrl: '../admin-info-create/admin-info-create.scss',
})
export class AdminNewsCreate implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private objectImageUrl: string | null = null;
  private createdId: string | null = null;

  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly newsStatus = signal(0);
  readonly previewVisible = signal(true);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);

  readonly form = createNewsForm(this.formBuilder);

  readonly preview = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  readonly previewTitle = computed(() => this.preview().title?.trim() || 'New article title');
  readonly previewDescription = computed(
    () => this.preview().description?.trim() || 'The news article description will appear here as you type.',
  );
  readonly previewListItem = computed<NewsListItemView>(() => ({
    id: 'news-preview',
    title: this.previewTitle(),
    imagePath: this.imagePreviewUrl(),
    status: this.newsStatus(),
  }));
  readonly previewDetails = computed<NewsDetailsViewModel>(() => ({
    id: 'news-preview',
    title: this.previewTitle(),
    description: this.previewDescription(),
    imagePath: this.imagePreviewUrl(),
    createdAt: new Date().toISOString(),
    status: this.newsStatus(),
  }));

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  updateStatusPreview(): void {
    this.newsStatus.set(this.form.controls.status.value ?? 0);
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

  submit(): void {
    if (this.form.invalid || this.submitting() || !this.selectedImage()) {
      this.form.markAllAsTouched();
      if (!this.selectedImage()) {
        this.imageError.set('Choose an image for this news article.');
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
    const request: CreateNewsItemRequest = {
      title: value.title!.trim(),
      description: value.description!.trim(),
    };

    this.submitting.set(true);
    this.error.set(null);

    // The status is a second request. If it fails after the create succeeded, the item
    // exists — remember its id so retrying finishes the job instead of creating a duplicate.
    const create$ = this.createdId !== null
      ? of(this.createdId)
      : this.api.createNews(request, this.selectedImage()!).pipe(
          map((created) => {
            this.createdId = created.id;
            return created.id;
          }),
        );

    create$.pipe(
      switchMap((id) => (value.status === 0 ? of(null) : this.api.updateNewsStatus(id, value.status!))),
    ).subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'news' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          this.createdId !== null
            ? 'The news article was created but could not be published. Save again to retry publishing — this will not create a duplicate.'
            : response?.error?.detail ?? response?.error?.error ?? 'The news article could not be created.',
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
