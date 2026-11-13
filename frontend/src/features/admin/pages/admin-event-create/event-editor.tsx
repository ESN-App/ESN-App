import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { Host } from '../../../../shared/host';
import type { EventDetailsViewModel } from '../../../events/components/event-details-view/event-details-view';
import { AdminDateTimePicker } from '../../components/admin-date-time-picker/admin-date-time-picker';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminEventPreview } from '../../components/admin-preview-panel/admin-preview-panel';
import { AutosizeTextarea } from '../../components/autosize-textarea';
import { adminApi, type CreateEventRequest } from '../../data-access/admin-api';
import { apiErrorMessage, ConfirmationDialog, useTouchedFields } from '../../utils/form-state';
import { isOptionalAbsoluteUrl, parseNumber } from '../../utils/form-validators';
import { imageFileError, useObjectUrl } from '../../utils/image-file';
import './admin-event-create.scss';

interface EventFormValue {
  status: number;
  title: string;
  shortDescription: string;
  description: string;
  location: string;
  startsAt: Date | null;
  endsAt: Date | null;
  price: number | null;
  registrationUrl: string;
  googleMapsUrl: string;
  minimumParticipants: number | null;
  maximumParticipants: number | null;
}

const EMPTY_FORM: EventFormValue = {
  status: 0,
  title: '',
  shortDescription: '',
  description: '',
  location: '',
  startsAt: null,
  endsAt: null,
  price: 0,
  registrationUrl: '',
  googleMapsUrl: '',
  minimumParticipants: null,
  maximumParticipants: null,
};

const EVENTS_LINK = { pathname: '/admin', search: '?section=events' };

const STATUS_OPTIONS = [
  { value: 0, modifier: 'draft', label: 'Draft', hint: 'Visible only to logged-in administrators.' },
  { value: 1, modifier: 'published', label: 'Published', hint: 'Visible to everyone.' },
  { value: 2, modifier: 'cancelled', label: 'Cancelled', hint: 'Visible to everyone and marked as cancelled.' },
];

function optionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function validate(value: EventFormValue) {
  const length = (text: string, max: number) => !text || text.length > max;
  const errors = {
    status: false,
    title: length(value.title, 200),
    shortDescription: length(value.shortDescription, 200),
    description: length(value.description, 5000),
    location: length(value.location, 500),
    startsAt: value.startsAt === null,
    price: value.price === null || value.price < 0,
    registrationUrl: value.registrationUrl.length > 2000 || !isOptionalAbsoluteUrl(value.registrationUrl),
    googleMapsUrl: value.googleMapsUrl.length > 2000 || !isOptionalAbsoluteUrl(value.googleMapsUrl),
    minimumParticipants: value.minimumParticipants !== null && value.minimumParticipants < 0,
    maximumParticipants: value.maximumParticipants !== null && value.maximumParticipants < 0,
  };
  const endBeforeStart = Boolean(
    value.startsAt && value.endsAt && value.endsAt.getTime() <= value.startsAt.getTime(),
  );
  const maximumBelowMinimum =
    !endBeforeStart &&
    value.minimumParticipants !== null &&
    value.maximumParticipants !== null &&
    value.maximumParticipants < value.minimumParticipants;
  const invalid = Object.values(errors).some(Boolean) || endBeforeStart || maximumBelowMinimum;
  return { errors, endBeforeStart, maximumBelowMinimum, invalid };
}

function serialize(value: EventFormValue): string {
  return JSON.stringify(value);
}

interface EventEditorProps {
  mode: 'create' | 'edit';
  eventId?: string;
}

export function EventEditor({ mode, eventId }: EventEditorProps) {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const objectUrl = useObjectUrl();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const createdIdRef = useRef<string | null>(null);
  const fields = useTouchedFields();

  const [form, setForm] = useState<EventFormValue>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState(0);
  const [initialFormState, setInitialFormState] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);

  useEffect(() => {
    if (!isEdit || !eventId) {
      return;
    }
    let active = true;
    adminApi.getEvent(eventId).then(
      (event) => {
        if (!active) return;
        const loaded: EventFormValue = {
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
        };
        setForm(loaded);
        setInitialStatus(event.status);
        setExistingImagePath(event.imagePath);
        setImagePreviewUrl(event.imagePath);
        setInitialFormState(serialize(loaded));
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setLoading(false);
        setLoadFailed(true);
        setError(apiErrorMessage(err, 'The event could not be loaded.', true));
      },
    );
    return () => {
      active = false;
    };
  }, [isEdit, eventId]);

  const { errors, endBeforeStart, maximumBelowMinimum, invalid } = validate(form);
  const hasChanges = !isEdit || imageChanged || (initialFormState !== null && serialize(form) !== initialFormState);

  const update = <K extends keyof EventFormValue>(field: K, value: EventFormValue[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    fields.markDirty(field);
  };

  const textProps = (field: 'title' | 'shortDescription' | 'description' | 'location' | 'registrationUrl' | 'googleMapsUrl') => ({
    value: form[field],
    className: fields.invalidClass(field, errors[field]),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, event.currentTarget.value),
    onBlur: () => fields.markTouched(field),
  });

  const numberProps = (field: 'price' | 'minimumParticipants' | 'maximumParticipants') => ({
    type: 'number',
    value: form[field] ?? '',
    className: fields.invalidClass(field, errors[field]),
    onChange: (event: ChangeEvent<HTMLInputElement>) => update(field, parseNumber(event.currentTarget.value)),
    onBlur: () => fields.markTouched(field),
  });

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    objectUrl.revoke();
    setSelectedImage(null);
    setImagePreviewUrl(isEdit ? existingImagePath : null);
    setImageError(null);
    setImageRemoved(false);
    setImageChanged(false);

    if (!file) {
      return;
    }
    const message = imageFileError(file);
    if (message) {
      setImageError(message);
      input.value = '';
      return;
    }
    setSelectedImage(file);
    setImageChanged(true);
    setImagePreviewUrl(objectUrl.create(file));
  };

  const removeImage = () => {
    objectUrl.revoke();
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageError(null);
    const hadExistingImage = existingImagePath !== null;
    setImageRemoved(isEdit && hadExistingImage);
    setImageChanged(isEdit && hadExistingImage);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (invalid || submitting || !hasChanges) {
      fields.touchAll();
      return;
    }
    setConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    setConfirmationOpen(false);
    if (invalid || submitting || !hasChanges) {
      return;
    }

    const request: CreateEventRequest = {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      startsAt: form.startsAt!.toISOString(),
      endsAt: form.endsAt?.toISOString() ?? null,
      price: form.price!,
      registrationUrl: optionalText(form.registrationUrl),
      googleMapsUrl: optionalText(form.googleMapsUrl),
      minimumParticipants: form.minimumParticipants,
      maximumParticipants: form.maximumParticipants,
    };

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && eventId) {
        await adminApi.updateEvent(eventId, request, selectedImage, imageRemoved);
        if (form.status !== initialStatus) {
          await adminApi.updateEventStatus(eventId, form.status);
        }
      } else {
        // The status is a second request. If it fails after the create succeeded, the item
        // exists — remember its id so retrying finishes the job instead of creating a duplicate.
        if (createdIdRef.current === null) {
          createdIdRef.current = (await adminApi.createEvent(request, selectedImage)).id;
        }
        if (form.status !== 0) {
          await adminApi.updateEventStatus(createdIdRef.current, form.status);
        }
      }
      navigate(EVENTS_LINK);
    } catch (err) {
      setSubmitting(false);
      if (isEdit) {
        setError(apiErrorMessage(err, 'The event changes could not be saved.', true));
      } else {
        setError(
          createdIdRef.current !== null
            ? 'The event was created but could not be published. Save again to retry publishing — this will not create a duplicate.'
            : apiErrorMessage(err, 'The event could not be created.', true),
        );
      }
    }
  };

  const previewEvent: EventDetailsViewModel = {
    id: eventId ?? 'event-preview',
    title: form.title.trim() || 'New event title',
    shortDescription: form.shortDescription.trim() || 'Your short event description will appear here.',
    description: form.description.trim() || 'Your full event description will appear here as you type.',
    location: form.location.trim() || 'Event location',
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    imagePath: imagePreviewUrl,
    currentParticipants: null,
    minimumParticipants: form.minimumParticipants,
    maximumParticipants: form.maximumParticipants,
    googleMapsUrl: optionalText(form.googleMapsUrl),
    registrationUrl: optionalText(form.registrationUrl),
    price: form.price ?? 0,
    status: form.status,
  };

  const showError = (field: keyof typeof errors) => fields.showError(field, errors[field]);

  const editorForm = (
    <form className="event-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <div>
          <h2>Event information</h2>
          <p>Fields marked with * are required.</p>
        </div>
        <button type="button" className="preview-toggle" onClick={() => setPreviewVisible((visible) => !visible)}>
          {previewVisible ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      <fieldset className="status-field">
        <legend>Event status</legend>
        <p>Choose who can see this event and how it appears.</p>
        <div className="status-options">
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value} className={`status-option status-option--${option.modifier}`}>
              <input
                type="radio"
                name="status"
                checked={form.status === option.value}
                onChange={() => update('status', option.value)}
                onBlur={() => fields.markTouched('status')}
              />
              <span className="status-option__dot" aria-hidden="true"></span>
              <span className="status-option__copy">
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
              <span className="status-option__choice" aria-hidden="true"></span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Title *</span>
        <input type="text" maxLength={200} placeholder="For example: Welcome Party" {...textProps('title')} />
        <span className="character-count">{form.title.length}/200</span>
        {showError('title') && <small>Enter an event title (maximum 200 characters).</small>}
      </label>

      <label className="field">
        <span>Short description *</span>
        <AutosizeTextarea
          maxLength={200}
          minRows={3}
          placeholder="A short summary shown on the events list"
          {...textProps('shortDescription')}
        />
        <span className="character-count">{form.shortDescription.length}/200</span>
        {showError('shortDescription') && <small>Enter a short description (maximum 200 characters).</small>}
      </label>

      <label className="field">
        <span>Full description *</span>
        <AutosizeTextarea
          maxLength={5000}
          minRows={6}
          placeholder="Describe the event, programme, and anything attendees should know"
          {...textProps('description')}
        />
        <span className="character-count">{form.description.length}/5000</span>
        {showError('description') && <small>Enter the full event description (maximum 5,000 characters).</small>}
      </label>

      <label className="field">
        <span>Location *</span>
        <input type="text" maxLength={500} placeholder="Venue or meeting point" {...textProps('location')} />
        {showError('location') && <small>Enter the event location.</small>}
      </label>

      <label className="field">
        <span>Google Maps URL</span>
        <input type="url" maxLength={2000} placeholder="Paste a Google Maps link" {...textProps('googleMapsUrl')} />
        {showError('googleMapsUrl') && <small>Enter a valid absolute URL.</small>}
      </label>

      <div className="schedule-grid">
        <div className="field date-time-field">
          <label htmlFor="event-starts-at">Starts at *</label>
          <AdminDateTimePicker
            inputId="event-starts-at"
            className={fields.invalidClass('startsAt', errors.startsAt)}
            value={form.startsAt}
            onChange={(value) => update('startsAt', value)}
            onBlur={() => fields.markTouched('startsAt')}
          />
          {showError('startsAt') && <small>Choose a start date and time.</small>}
        </div>
        <div className="field date-time-field">
          <label htmlFor="event-ends-at">Ends at</label>
          <AdminDateTimePicker
            inputId="event-ends-at"
            value={form.endsAt}
            onChange={(value) => update('endsAt', value)}
            onBlur={() => fields.markTouched('endsAt')}
          />
        </div>
      </div>
      {endBeforeStart && fields.isDirty('endsAt') && (
        <p className="group-error">End time must be later than start time.</p>
      )}

      <label className="field price-field">
        <span>Price *</span>
        <span className="price-control">
          <input min="0" step="0.01" {...numberProps('price')} />
          <span>PLN</span>
        </span>
        {showError('price') && <small>Price must be zero or more.</small>}
      </label>

      <div className="field">
        <span>Event image</span>
        <div className="upload-control">
          <input
            ref={imageInputRef}
            className="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={chooseImage}
          />
          {imagePreviewUrl && (
            <button type="button" onClick={removeImage}>
              Remove photo
            </button>
          )}
        </div>
        <span className="field-hint">JPEG, PNG, or WebP, up to 8 MB.</span>
        {imageError && <small>{imageError}</small>}
      </div>

      <label className="field">
        <span>Registration URL</span>
        <input
          type="url"
          maxLength={2000}
          placeholder="Paste the registration form link"
          {...textProps('registrationUrl')}
        />
        {showError('registrationUrl') && <small>Enter a valid absolute URL.</small>}
      </label>

      <fieldset className="participant-section">
        <legend>Participant limits</legend>
        <div className="participant-fields">
          <label className="field">
            <span>Minimum participants</span>
            <input min="0" {...numberProps('minimumParticipants')} />
          </label>
          <label className="field">
            <span>Maximum participants</span>
            <input min="0" {...numberProps('maximumParticipants')} />
          </label>
        </div>
        {maximumBelowMinimum && <p className="group-error">Maximum participants cannot be below the minimum.</p>}
      </fieldset>

      {error && (
        <div className="save-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        <Link to={EVENTS_LINK}>Cancel</Link>
        <div className="save-action">
          {isEdit ? (
            <>
              <button type="submit" disabled={invalid || submitting || !hasChanges}>
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
              {!hasChanges && <small>No changes to save yet.</small>}
            </>
          ) : (
            <>
              <button type="submit" disabled={invalid || submitting}>
                {submitting ? 'Saving…' : 'Create event'}
              </button>
              {invalid && <small>Fill in all required fields to continue.</small>}
            </>
          )}
        </div>
      </div>
    </form>
  );

  return (
    <Host tag={isEdit ? 'app-admin-event-edit' : 'app-admin-event-create'}>
      <main className="create-page">
        <header className="page-header">
          <div>
            <Link className="back-link" to={EVENTS_LINK}>
              <span className="back-icon" aria-hidden="true"></span>
              <span>Admin panel</span>
            </Link>
            <p className="eyebrow">Events administration</p>
            <h1>{isEdit ? 'Edit event' : 'Create event'}</h1>
            <p>
              {isEdit
                ? 'Update the event information and publishing status.'
                : 'Complete the required information and choose the event status.'}
            </p>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : loadFailed ? (
          <div className="save-error" role="alert">
            <p>{error}</p>
            <Link to={EVENTS_LINK}>Back to admin panel</Link>
          </div>
        ) : (
          <AdminEditorLayout
            previewVisible={previewVisible}
            form={editorForm}
            preview={<AdminEventPreview event={previewEvent} />}
          />
        )}

        {confirmationOpen && (
          <ConfirmationDialog
            title={isEdit ? 'Save these changes?' : 'Create this event?'}
            cancelLabel="Keep editing"
            confirmLabel={isEdit ? 'Yes, save changes' : 'Yes, create event'}
            busy={submitting}
            onCancel={() => setConfirmationOpen(false)}
            onConfirm={confirmSubmit}
          />
        )}
      </main>
    </Host>
  );
}
