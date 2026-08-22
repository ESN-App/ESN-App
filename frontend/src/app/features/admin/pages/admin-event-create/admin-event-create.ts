import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { EventDetailsViewModel } from '../../../events/components/event-details-view/event-details-view';
import { AdminApi, CreateEventRequest } from '../../data-access/admin-api';
import { AdminDateTimePicker } from '../../components/admin-date-time-picker/admin-date-time-picker';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminEventPreview } from '../../components/admin-event-preview/admin-event-preview';
import { createEventForm } from '../../utils/event-form';

@Component({
  selector: 'app-admin-event-create',
  imports: [AdminDateTimePicker, AdminEditorLayout, AdminEventPreview, ReactiveFormsModule, RouterLink, TextFieldModule],
  templateUrl: './admin-event-create.html',
  styleUrl: './admin-event-create.scss',
})
export class AdminEventCreate implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private objectImageUrl: string | null = null;
  private createdId: string | null = null;

  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly eventStatus = signal(0);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
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
    id: 'event-preview',
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

    // The status is a second request. If it fails after the create succeeded, the item
    // exists — remember its id so retrying finishes the job instead of creating a duplicate.
    const create$ = this.createdId !== null
      ? of(this.createdId)
      : this.api.createEvent(request, this.selectedImage()).pipe(
          map((created) => {
            this.createdId = created.id;
            return created.id;
          }),
        );

    create$.pipe(
      switchMap((id) => (value.status === 0 ? of(null) : this.api.updateEventStatus(id, value.status!))),
    ).subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'events' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          this.createdId !== null
            ? 'The event was created but could not be published. Save again to retry publishing — this will not create a duplicate.'
            : response?.error?.detail ?? response?.error?.error ?? 'The event could not be created.',
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

  private revokeImagePreview(): void {
    if (this.objectImageUrl) {
      URL.revokeObjectURL(this.objectImageUrl);
      this.objectImageUrl = null;
    }
  }
}
