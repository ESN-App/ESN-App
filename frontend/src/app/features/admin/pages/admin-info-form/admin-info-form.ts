import { Component, computed, DestroyRef, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { Skeleton } from '../../../../shared';
import { InfoDetailsViewModel } from '../../../info/components/info-details-view/info-details-view';
import { InfoListItemView } from '../../../info/components/info-list-item/info-list-item';
import { createInfoSlug } from '../../../info/utils/info-url';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminInfoPreview } from '../../components/admin-info-preview/admin-info-preview';
import { AdminSaveLabel, SAVED_REDIRECT_DELAY_MS } from '../../components/admin-save-label/admin-save-label';
import { AdminToast } from '../../utils/admin-toast';
import { AdminApi, CreateInfoArticleRequest } from '../../data-access/admin-api';
import { createExternalLinkControl, createInfoForm } from '../../utils/info-form';

/** Creates an info article (`info/new`) or edits one (`info/:infoId/edit`). */
@Component({
  selector: 'app-admin-info-form',
  imports: [AdminSaveLabel, AdminEditorLayout, AdminInfoPreview, ReactiveFormsModule, RouterLink, Skeleton, TextFieldModule],
  templateUrl: './admin-info-form.html',
  styleUrl: './admin-info-form.scss',
})
export class AdminInfoForm implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private objectImageUrl: string | null = null;
  private createdId: string | null = null;

  readonly infoId = this.route.snapshot.paramMap.get('infoId');
  readonly isEdit = this.infoId !== null;

  readonly submitting = signal(false);
  readonly saved = signal(false);
  readonly confirmationOpen = signal(false);
  readonly loading = signal(this.isEdit);
  readonly loadFailed = signal(false);
  readonly error = signal<string | null>(null);
  readonly infoStatus = signal(0);
  readonly initialInfoStatus = signal(0);
  readonly initialFormState = signal<string | null>(null);
  readonly previewVisible = signal(true);
  readonly selectedImage = signal<File | null>(null);
  readonly currentImagePath = signal<string | null>(null);
  readonly imageRemoved = signal(false);
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
  readonly displayedImagePath = computed(
    () => this.imagePreviewUrl() ?? (this.imageRemoved() ? null : this.currentImagePath()),
  );
  readonly previewListItem = computed<InfoListItemView>(() => ({
    id: this.infoId ?? 'info-preview',
    title: this.previewTitle(),
    slug: this.preview().slug?.trim() || null,
    content: this.previewContent(),
    imagePath: this.displayedImagePath(),
    status: this.infoStatus(),
  }));
  readonly previewDetails = computed<InfoDetailsViewModel>(() => ({
    id: this.infoId ?? 'info-preview',
    title: this.previewTitle(),
    content: this.previewContent(),
    imagePath: this.displayedImagePath(),
    externalLinks: this.previewExternalLinks(),
    status: this.infoStatus(),
  }));
  /** Create mode can always save; edit mode only once something differs from the loaded article. */
  readonly hasChanges = computed(() => {
    if (!this.isEdit || this.selectedImage() !== null || this.imageRemoved()) {
      return true;
    }
    const currentState = this.serializeForm(this.preview());
    const initialState = this.initialFormState();
    return initialState !== null && currentState !== initialState;
  });

  get externalLinkControls() {
    return this.form.controls.externalLinks.controls;
  }

  constructor() {
    if (this.infoId !== null) {
      this.form.disable();
      this.loadInfoArticle(this.infoId);
    }
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

  removeCurrentImage(): void {
    this.imageRemoved.set(true);
  }

  onTitleInput(): void {
    // Only new articles derive the slug from the title; an existing slug is part of a published URL.
    if (this.isEdit || this.form.controls.slug.dirty) {
      return;
    }
    this.form.controls.slug.setValue(createInfoSlug(this.form.controls.title.value ?? ''), {
      emitEvent: false,
    });
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

    const save$ = this.infoId !== null
      ? this.update$(this.infoId, request, value.status!)
      : this.create$(request, value.status!);

    save$.subscribe({
      next: () => {
        // Show "Saved" briefly; the toast is root-level, so it stays up after the redirect.
        this.saved.set(true);
        this.toast.show(
          value.status === 1 && (!this.isEdit || this.initialInfoStatus() !== 1)
            ? 'Article published'
            : this.isEdit ? 'Article saved' : 'Article created',
        );
        // Cancelled if the admin leaves the form before the redirect.
        timer(SAVED_REDIRECT_DELAY_MS)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => void this.router.navigate(['/admin'], { queryParams: { section: 'info' } }));
      },
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          this.isEdit
            ? response?.error?.detail ?? response?.error?.error ?? 'The article changes could not be saved.'
            : this.createdId !== null
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

  private create$(request: CreateInfoArticleRequest, status: number): Observable<unknown> {
    // The status is a second request. If it fails after the create succeeded, the item
    // exists — remember its id so retrying finishes the job instead of creating a duplicate.
    const create$ = this.createdId !== null
      ? of(this.createdId)
      : this.api.createInfo(request, this.selectedImage()).pipe(
          map((created) => {
            this.createdId = created.id;
            return created.id;
          }),
        );

    return create$.pipe(
      switchMap((id) => (status === 0 ? of(null) : this.api.updateInfoStatus(id, status))),
    );
  }

  private update$(id: string, request: CreateInfoArticleRequest, status: number): Observable<unknown> {
    return this.api.updateInfo(id, request, this.selectedImage(), this.imageRemoved()).pipe(
      switchMap((updated) =>
        status !== this.initialInfoStatus()
          ? this.api.updateInfoStatus(id, status)
          : of(updated),
      ),
    );
  }

  private revokeImagePreview(): void {
    if (this.objectImageUrl) {
      URL.revokeObjectURL(this.objectImageUrl);
      this.objectImageUrl = null;
    }
  }

  private loadInfoArticle(id: string): void {
    this.error.set(null);
    this.api.getInfoArticle(id).subscribe({
      next: (article) => {
        this.form.patchValue({
          status: article.status,
          title: article.title,
          slug: article.slug,
          category: article.category,
          content: article.content,
        });
        this.currentImagePath.set(article.imagePath);
        this.applyExternalLinks(article.externalLinks);
        this.infoStatus.set(article.status);
        this.initialInfoStatus.set(article.status);
        this.initialFormState.set(this.serializeForm(this.form.getRawValue()));
        this.form.markAsPristine();
        this.form.enable();
        this.loading.set(false);
      },
      error: (response) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        this.error.set(
          response?.error?.detail ?? response?.error?.error ?? 'The article could not be loaded.',
        );
      },
    });
  }

  private applyExternalLinks(links: string[]): void {
    const array = this.form.controls.externalLinks;
    while (array.length > 0) {
      array.removeAt(0);
    }
    links.forEach((link) => {
      array.push(createExternalLinkControl(this.formBuilder, link));
    });
  }

  private serializeForm(value: unknown): string {
    return JSON.stringify(value);
  }
}
