import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { LoadingSpinner } from '../../../../shared';
import { EventDetailsViewModel } from '../../../events/components/event-details-view/event-details-view';
import { AdminApi, CreateEventRequest } from '../../data-access/admin-api';
import { AdminDateTimePicker } from '../../components/admin-date-time-picker/admin-date-time-picker';
import { AdminEventPreview } from '../../components/admin-event-preview/admin-event-preview';
import { createEventForm } from '../../utils/event-form';

@Component({
  selector: 'app-admin-event-edit',
  imports: [AdminDateTimePicker, AdminEventPreview, LoadingSpinner, ReactiveFormsModule, RouterLink, TextFieldModule],
  templateUrl: './admin-event-edit.html',
  styleUrl: '../admin-event-create/admin-event-create.scss',
})
export class AdminEventEdit implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private objectImageUrl: string | null = null;

  readonly eventId = this.route.snapshot.paramMap.get('eventId')!;

  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly error = signal<string | null>(null);
  readonly eventStatus = signal(0);
  readonly initialEventStatus = signal(0);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly existingImagePath = signal<string | null>(null);
  readonly imageRemoved = signal(false);
  readonly imageChanged = signal(false);
  readonly initialFormState = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly previewVisible = signal(true);

  readonly form = createEventForm(this.formBuilder);

  readonly preview = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  readonly previewTitle = computed(() => this.preview().title?.trim() || 'New event title');
  readonly previewShortDescription = computed(
    () => this.preview().shortDescription?.trim() || 'Your short event description will appear here.',
  );
  readonly previewDescription = computed(
    () => this.preview().description?.trim() || 'Your full event description will appear here as you type.',
  );
  readonly previewLocation = computed(
    () => this.preview().location?.trim() || 'Event location',
  );
  readonly previewStartsAt = computed(() => this.preview().startsAt ?? null);
  readonly previewEndsAt = computed(() => this.preview().endsAt ?? null);
  readonly previewEvent = computed<EventDetailsViewModel>(() => ({
    id: this.eventId,
    title: this.previewTitle(),
    shortDescription: this.previewShortDescription(),
    description: this.previewDescription(),
    location: this.previewLocation(),
    startsAt: this.previewStartsAt(),
    endsAt: this.previewEndsAt(),
    imagePath: this.imagePreviewUrl(),
    currentParticipants: null,
    minimumParticipants: this.preview().minimumParticipants ?? null,
    maximumParticipants: this.preview().maximumParticipants ?? null,
    googleMapsUrl: this.optionalText(this.preview().googleMapsUrl),
    registrationUrl: this.optionalText(this.preview().registrationUrl),
    price: this.preview().price ?? 0,
    status: this.eventStatus(),
  }));
  readonly hasChanges = computed(() => {
    const currentState = this.serializeForm(this.preview());
    const initialState = this.initialFormState();
    return this.imageChanged() || (initialState !== null && currentState !== initialState);
  });

  constructor() {
    this.form.disable();
    this.loadEvent(this.eventId);
  }

  ngOnDestroy(): void {
    this.revokeImagePreview();
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  updateStatusPreview(): void {
    this.eventStatus.set(this.form.controls.status.value ?? 0);
  }

  togglePreview(): void {
    this.previewVisible.update((visible) => !visible);
  }

  chooseImage(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.revokeImagePreview();
    this.selectedImage.set(null);
    this.imagePreviewUrl.set(this.existingImagePath());
    this.imageError.set(null);
    this.imageRemoved.set(false);
    this.imageChanged.set(false);

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
    this.imageChanged.set(true);
    this.objectImageUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.objectImageUrl);
  }

  removeImage(input: HTMLInputElement): void {
    this.revokeImagePreview();
    this.selectedImage.set(null);
    this.imagePreviewUrl.set(null);
    this.imageError.set(null);
    const hadExistingImage = this.existingImagePath() !== null;
    this.imageRemoved.set(hadExistingImage);
    this.imageChanged.set(hadExistingImage);
    input.value = '';
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
    const request: CreateEventRequest = {
      title: value.title!.trim(),
      shortDescription: value.shortDescription!.trim(),
      description: value.description!.trim(),
      location: value.location!.trim(),
      startsAt: value.startsAt!.toISOString(),
      endsAt: value.endsAt?.toISOString() ?? null,
      price: value.price!,
      registrationUrl: this.optionalText(value.registrationUrl),
      googleMapsUrl: this.optionalText(value.googleMapsUrl),
      minimumParticipants: value.minimumParticipants,
      maximumParticipants: value.maximumParticipants,
    };

    this.submitting.set(true);
    this.error.set(null);

    this.api.updateEvent(this.eventId, request, this.selectedImage(), this.imageRemoved()).pipe(
      switchMap((updated) =>
        value.status !== this.initialEventStatus()
          ? this.api.updateEventStatus(this.eventId, value.status!)
          : of(updated),
      ),
    ).subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'events' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          response?.error?.detail ?? response?.error?.error ?? 'The event changes could not be saved.',
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

  private loadEvent(id: string): void {
    this.error.set(null);
    this.api.getEvent(id).subscribe({
      next: (event) => {
        this.form.patchValue({
          status: event.status,
          title: event.title,
          shortDescription: event.shortDescription,
          description: event.description,
          location: event.location,
          startsAt: new Date(event.startsAt),
          endsAt: event.endsAt ? new Date(event.endsAt) : null,
          price: event.price,
          registrationUrl: event.registrationUrl ?? '',
          googleMapsUrl: event.googleMapsUrl ?? '',
          minimumParticipants: event.minimumParticipants,
          maximumParticipants: event.maximumParticipants,
        });
        this.eventStatus.set(event.status);
        this.initialEventStatus.set(event.status);
        this.existingImagePath.set(event.imagePath);
        this.imagePreviewUrl.set(event.imagePath);
        this.imageRemoved.set(false);
        this.imageChanged.set(false);
        this.initialFormState.set(this.serializeForm(this.form.getRawValue()));
        this.form.markAsPristine();
        this.form.enable();
        this.loading.set(false);
      },
      error: (response) => {
        this.loading.set(false);
        this.loadFailed.set(true);
        this.error.set(
          response?.error?.detail ?? response?.error?.error ?? 'The event could not be loaded.',
        );
      },
    });
  }

  private revokeImagePreview(): void {
    if (this.objectImageUrl) {
      URL.revokeObjectURL(this.objectImageUrl);
      this.objectImageUrl = null;
    }
  }

  private serializeForm(value: unknown): string {
    return JSON.stringify(value);
  }
}
