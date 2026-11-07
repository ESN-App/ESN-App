import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { LoadingSpinner } from '../../../../shared';
import { AdminApi, CreateDiscountRequest, CreatePartnerRequest, DiscountDto } from '../../data-access/admin-api';
import { PartnerDetailsViewModel } from '../../../partners/components/partner-details-view/partner-details-view';
import { PartnerOffer } from '../../../partners/data-access/partners.models';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminPartnerPreview } from '../../components/admin-partner-preview/admin-partner-preview';
import { createDiscountGroup, createPartnerForm } from '../../utils/partner-form';

type PartnerFormValue = ReturnType<ReturnType<typeof createPartnerForm>['getRawValue']>;

/** Creates a partner (`partners/new`) or edits one (`partners/:partnerSlug/edit`). */
@Component({
  selector: 'app-admin-partner-form',
  imports: [AdminEditorLayout, AdminPartnerPreview, LoadingSpinner, ReactiveFormsModule, RouterLink, TextFieldModule],
  templateUrl: './admin-partner-form.html',
  styleUrl: './admin-partner-form.scss',
})
export class AdminPartnerForm implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private objectLogoUrl: string | null = null;
  private createdPartnerId: string | null = null;
  private statusApplied = false;
  private readonly createdDiscountIndexes = new Set<number>();

  readonly partnerSlug = this.route.snapshot.paramMap.get('partnerSlug');
  readonly isEdit = this.partnerSlug !== null;

  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly loading = signal(this.isEdit);
  readonly loadFailed = signal(false);
  readonly error = signal<string | null>(null);
  readonly partnerStatus = signal(0);
  readonly initialPartnerStatus = signal(0);
  readonly selectedLogo = signal<File | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly existingLogoPath = signal<string | null>(null);
  readonly logoChanged = signal(false);
  readonly initialFormState = signal<string | null>(null);
  readonly initialDiscountIds = signal<ReadonlySet<string>>(new Set());
  readonly logoError = signal<string | null>(null);
  readonly loadedPartnerId = signal<string | null>(null);
  readonly previewVisible = signal(true);

  readonly form = createPartnerForm(this.formBuilder);

  readonly preview = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  readonly previewName = computed(() => this.preview().name?.trim() || 'New partner name');
  readonly previewShortDescription = computed(
    () => this.preview().shortDescription?.trim() || 'Your short partner description will appear here.',
  );
  readonly previewDescription = computed(
    () => this.preview().description?.trim() || 'Your full partner description will appear here as you type.',
  );
  readonly previewAddress = computed(() => this.preview().address?.trim() || null);
  readonly previewOffers = computed<PartnerOffer[]>(() =>
    (this.preview().discounts ?? []).map((discount, index) => ({
      id: `discount-preview-${index}`,
      title: discount?.title?.trim() || 'New discount title',
      description: discount?.description?.trim() || '',
      partnerId: 'partner-preview',
      partnerName: null,
    })),
  );
  readonly previewPartner = computed<PartnerDetailsViewModel>(() => ({
    id: this.loadedPartnerId() ?? 'partner-preview',
    slug: this.partnerSlug,
    name: this.previewName(),
    logoPath: this.logoPreviewUrl(),
    shortDescription: this.previewShortDescription(),
    status: this.partnerStatus(),
    offersCount: this.previewOffers().length,
    description: this.previewDescription(),
    address: this.previewAddress(),
    websiteUrl: this.optionalText(this.preview().websiteUrl),
    googleMapsUrl: this.optionalText(this.preview().googleMapsUrl),
    latitude: this.preview().latitude ?? null,
    longitude: this.preview().longitude ?? null,
    offers: this.previewOffers(),
  }));
  /** Create mode can always save; edit mode only once something differs from the loaded partner. */
  readonly hasChanges = computed(() => {
    if (!this.isEdit) {
      return true;
    }
    const currentState = this.serializeForm(this.preview());
    const initialState = this.initialFormState();
    return this.logoChanged() || (initialState !== null && currentState !== initialState);
  });
  /** A new partner needs a logo; an existing one keeps its current logo. */
  readonly missingLogo = computed(() => !this.isEdit && this.selectedLogo() === null);

  get discountGroups() {
    return this.form.controls.discounts.controls;
  }

  constructor() {
    if (this.partnerSlug !== null) {
      this.form.disable();
      this.loadPartner(this.partnerSlug);
    }
  }

  ngOnDestroy(): void {
    this.revokeLogoPreview();
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  showDiscountError(index: number, controlName: string): boolean {
    const control = this.discountGroups[index]?.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  addDiscount(): void {
    this.form.controls.discounts.push(createDiscountGroup(this.formBuilder));
  }

  removeDiscount(index: number): void {
    this.form.controls.discounts.removeAt(index);
  }

  updateStatusPreview(): void {
    this.partnerStatus.set(this.form.controls.status.value ?? 0);
  }

  togglePreview(): void {
    this.previewVisible.update((visible) => !visible);
  }

  chooseLogo(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.revokeLogoPreview();
    this.selectedLogo.set(null);
    this.logoPreviewUrl.set(this.existingLogoPath());
    this.logoError.set(null);
    this.logoChanged.set(false);

    if (!file) {
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.logoError.set('Choose a JPEG, PNG, or WebP image.');
      input.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.logoError.set('The image must be no larger than 8 MB.');
      input.value = '';
      return;
    }

    this.selectedLogo.set(file);
    this.logoChanged.set(true);
    this.objectLogoUrl = URL.createObjectURL(file);
    this.logoPreviewUrl.set(this.objectLogoUrl);
  }

  removeLogo(input: HTMLInputElement): void {
    this.revokeLogoPreview();
    this.selectedLogo.set(null);
    this.logoPreviewUrl.set(this.existingLogoPath());
    this.logoError.set(null);
    this.logoChanged.set(false);
    input.value = '';
  }

  submit(): void {
    if (this.form.invalid || this.submitting() || !this.hasChanges() || this.missingLogo()) {
      this.form.markAllAsTouched();
      if (this.missingLogo()) {
        this.logoError.set('Choose a logo image for this partner.');
      }
      return;
    }

    this.confirmationOpen.set(true);
  }

  cancelConfirmation(): void {
    this.confirmationOpen.set(false);
  }

  confirmSubmit(): void {
    if (this.form.invalid || this.submitting() || !this.hasChanges() || this.missingLogo()) {
      this.confirmationOpen.set(false);
      return;
    }

    this.confirmationOpen.set(false);

    const partnerId = this.loadedPartnerId();
    if (this.isEdit && !partnerId) {
      return;
    }

    const value = this.form.getRawValue();
    const request: CreatePartnerRequest = {
      name: value.name!.trim(),
      shortDescription: value.shortDescription!.trim(),
      description: value.description!.trim(),
      address: this.optionalText(value.address),
      websiteUrl: this.optionalText(value.websiteUrl),
      googleMapsUrl: this.optionalText(value.googleMapsUrl),
      latitude: value.latitude,
      longitude: value.longitude,
    };

    this.submitting.set(true);
    this.error.set(null);

    const save$ = partnerId !== null
      ? this.update$(partnerId, request, value)
      : this.create$(request, value);

    save$.subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'partners' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          this.isEdit
            ? response?.error?.detail ?? response?.error?.error ?? 'The partner changes could not be saved.'
            : this.createdPartnerId !== null
              ? 'The partner was created but some details could not be saved. Save again to finish — this will not create a duplicate.'
              : response?.error?.detail ?? response?.error?.error ?? 'The partner could not be created.',
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

  private create$(request: CreatePartnerRequest, value: PartnerFormValue): Observable<unknown> {
    const newDiscounts = (value.discounts ?? [])
      .map((discount) => ({
        title: discount.title?.trim() ?? '',
        description: discount.description?.trim() ?? '',
      }))
      .filter((discount) => discount.title.length > 0);

    // Creating a partner takes three requests (partner, status, offers). If a later one
    // fails, the partner already exists — remember what landed so retrying finishes the
    // job instead of creating a duplicate partner or duplicate offers.
    const create$ = this.createdPartnerId !== null
      ? of(this.createdPartnerId)
      : this.api.createPartner(request, this.selectedLogo()!).pipe(
          map((created) => {
            this.createdPartnerId = created.id;
            return created.id;
          }),
        );

    return create$.pipe(
      switchMap((partnerId) => {
        const statusUpdate$: Observable<unknown> = value.status === 0 || this.statusApplied
          ? of(null)
          : this.api.updatePartnerStatus(partnerId, value.status!).pipe(
              tap(() => (this.statusApplied = true)),
            );

        return statusUpdate$.pipe(
          switchMap(() => this.saveNewDiscounts(partnerId, newDiscounts)),
        );
      }),
    );
  }

  private update$(partnerId: string, request: CreatePartnerRequest, value: PartnerFormValue): Observable<unknown> {
    const currentDiscounts = (value.discounts ?? [])
      .map((discount) => ({
        id: discount.id ?? null,
        title: discount.title?.trim() ?? '',
        description: discount.description?.trim() ?? '',
      }))
      .filter((discount) => discount.title.length > 0);
    const newDiscounts = currentDiscounts.filter((discount) => !discount.id);
    const existingDiscounts = currentDiscounts.filter(
      (discount): discount is { id: string; title: string; description: string } => discount.id !== null,
    );
    const currentDiscountIds = new Set(existingDiscounts.map((discount) => discount.id));
    const deletedDiscountIds = [...this.initialDiscountIds()].filter((id) => !currentDiscountIds.has(id));

    return this.api.updatePartner(partnerId, request, this.selectedLogo()).pipe(
      switchMap((updated) =>
        value.status !== this.initialPartnerStatus()
          ? this.api.updatePartnerStatus(partnerId, value.status!)
          : of(updated),
      ),
      switchMap((updated) =>
        this.saveDiscounts(partnerId, newDiscounts, existingDiscounts, deletedDiscountIds).pipe(
          map(() => updated),
        ),
      ),
    );
  }

  private saveNewDiscounts(
    partnerId: string,
    newDiscounts: { title: string; description: string }[],
  ): Observable<unknown> {
    // Skip offers a previous attempt already created, so a retry does not duplicate them.
    const pending = newDiscounts
      .map((discount, index) => ({ discount, index }))
      .filter(({ index }) => !this.createdDiscountIndexes.has(index));

    if (pending.length === 0) {
      return of(null);
    }

    return forkJoin(
      pending.map(({ discount, index }): ReturnType<AdminApi['createDiscount']> => {
        const request: CreateDiscountRequest = { ...discount, partnerId };
        return this.api.createDiscount(request).pipe(
          tap(() => this.createdDiscountIndexes.add(index)),
        );
      }),
    );
  }

  private saveDiscounts(
    partnerId: string,
    newDiscounts: { title: string; description: string }[],
    existingDiscounts: { id: string; title: string; description: string }[],
    deletedDiscountIds: string[],
  ): Observable<unknown> {
    const operations: Observable<unknown>[] = [
      ...newDiscounts.map((discount): ReturnType<AdminApi['createDiscount']> => {
        const request: CreateDiscountRequest = { ...discount, partnerId };
        return this.api.createDiscount(request);
      }),
      ...existingDiscounts.map((discount) =>
        this.api.updateDiscount(discount.id, {
          title: discount.title,
          description: discount.description,
        }),
      ),
      ...deletedDiscountIds.map((id) => this.api.deleteDiscount(id)),
    ];

    return operations.length === 0 ? of(null) : forkJoin(operations);
  }

  private loadPartner(slug: string): void {
    this.error.set(null);
    this.api.getPartnerBySlug(slug).pipe(
      switchMap((partner) =>
        this.api.getPartnerDiscounts(partner.id).pipe(
          map((discounts) => ({ partner, discounts })),
        ),
      ),
    ).subscribe({
      next: ({ partner, discounts }) => {
        this.loadedPartnerId.set(partner.id);
        this.form.patchValue({
          status: partner.status,
          name: partner.name,
          shortDescription: partner.shortDescription,
          description: partner.description,
          address: partner.address ?? '',
          websiteUrl: partner.websiteUrl ?? '',
          googleMapsUrl: partner.googleMapsUrl ?? '',
          latitude: partner.latitude,
          longitude: partner.longitude,
        });
        this.applyDiscounts(discounts);
        this.partnerStatus.set(partner.status);
        this.initialPartnerStatus.set(partner.status);
        this.initialDiscountIds.set(new Set(discounts.map((discount) => discount.id)));
        this.existingLogoPath.set(partner.logoPath);
        this.logoPreviewUrl.set(partner.logoPath);
        this.logoChanged.set(false);
        this.initialFormState.set(this.serializeForm(this.form.getRawValue()));
        this.form.markAsPristine();
        this.form.enable();
        this.loading.set(false);
      },
      error: (response) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        this.error.set(
          response?.error?.detail ?? response?.error?.error ?? 'The partner could not be loaded.',
        );
      },
    });
  }

  private applyDiscounts(discounts: DiscountDto[]): void {
    const array = this.form.controls.discounts;
    while (array.length > 0) {
      array.removeAt(0);
    }
    discounts.forEach((discount) => {
      array.push(createDiscountGroup(this.formBuilder, discount));
    });
  }

  private revokeLogoPreview(): void {
    if (this.objectLogoUrl) {
      URL.revokeObjectURL(this.objectLogoUrl);
      this.objectLogoUrl = null;
    }
  }

  private serializeForm(value: unknown): string {
    return JSON.stringify(value);
  }
}
