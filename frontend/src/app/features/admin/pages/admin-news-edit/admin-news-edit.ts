import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { LoadingSpinner } from '../../../../shared';
import { NewsDetailsViewModel } from '../../../home/components/news-details-view/news-details-view';
import { NewsListItemView } from '../../../home/components/news-list-item/news-list-item';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminNewsPreview } from '../../components/admin-news-preview/admin-news-preview';
import { AdminApi, CreateNewsItemRequest } from '../../data-access/admin-api';
import { createNewsForm } from '../../utils/news-form';

@Component({
  selector: 'app-admin-news-edit',
  imports: [AdminEditorLayout, AdminNewsPreview, LoadingSpinner, ReactiveFormsModule, RouterLink, TextFieldModule],
  templateUrl: './admin-news-edit.html',
  styleUrl: '../admin-info-create/admin-info-create.scss',
})
export class AdminNewsEdit implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private objectImageUrl: string | null = null;

  readonly newsId = this.route.snapshot.paramMap.get('newsId')!;

  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly error = signal<string | null>(null);
  readonly newsStatus = signal(0);
  readonly initialNewsStatus = signal(0);
  readonly initialFormState = signal<string | null>(null);
  readonly previewVisible = signal(true);
  readonly selectedImage = signal<File | null>(null);
  readonly currentImagePath = signal<string | null>(null);
  readonly createdAt = signal<string | null>(null);
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
  readonly displayedImagePath = computed(() => this.imagePreviewUrl() ?? this.currentImagePath());
  readonly previewListItem = computed<NewsListItemView>(() => ({
    id: this.newsId,
    title: this.previewTitle(),
    imagePath: this.displayedImagePath(),
    status: this.newsStatus(),
  }));
  readonly previewDetails = computed<NewsDetailsViewModel>(() => ({
    id: this.newsId,
    title: this.previewTitle(),
    description: this.previewDescription(),
    imagePath: this.displayedImagePath(),
    createdAt: this.createdAt(),
    status: this.newsStatus(),
  }));
  readonly hasChanges = computed(() => {
    if (this.selectedImage() !== null) {
      return true;
    }
    const currentState = this.serializeForm(this.preview());
    const initialState = this.initialFormState();
    return initialState !== null && currentState !== initialState;
  });

  constructor() {
    this.form.disable();
    this.loadNewsItem(this.newsId);
  }

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
    if (this.form.invalid || this.submitting() || !this.hasChanges()) {
      this.form.markAllAsTouched();
      return;
    }

    this.confirmationOpen.set(true);
  }

  cancelConfirmation(): void {
    this.confirmationOpen.set(false);
  }

  confirmSubmit(): void {
    if (this.form.invalid || this.submitting() || !this.hasChanges()) {
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

    this.api.updateNews(this.newsId, request, this.selectedImage()).pipe(
      switchMap((updated) =>
        value.status !== this.initialNewsStatus()
          ? this.api.updateNewsStatus(this.newsId, value.status!)
          : of(updated),
      ),
    ).subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'news' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          response?.error?.detail ?? response?.error?.error ?? 'The news article changes could not be saved.',
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

  private loadNewsItem(id: string): void {
    this.error.set(null);
    this.api.getNewsItem(id).subscribe({
      next: (item) => {
        this.form.patchValue({
          status: item.status,
          title: item.title,
          description: item.description,
        });
        this.currentImagePath.set(item.imagePath || null);
        this.createdAt.set(item.createdAt);
        this.newsStatus.set(item.status);
        this.initialNewsStatus.set(item.status);
        this.initialFormState.set(this.serializeForm(this.form.getRawValue()));
        this.form.markAsPristine();
        this.form.enable();
        this.loading.set(false);
      },
      error: (response) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        this.error.set(
          response?.error?.detail ?? response?.error?.error ?? 'The news article could not be loaded.',
        );
      },
    });
  }

  private serializeForm(value: unknown): string {
    return JSON.stringify(value);
  }
}
