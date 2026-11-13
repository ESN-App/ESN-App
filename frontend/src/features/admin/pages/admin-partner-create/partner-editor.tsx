import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { Host } from '../../../../shared/host';
import type { PartnerOffer } from '../../../partners/data-access/partners.models';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminPartnerPreview } from '../../components/admin-preview-panel/admin-preview-panel';
import { AutosizeTextarea } from '../../components/autosize-textarea';
import { adminApi, type CreatePartnerRequest } from '../../data-access/admin-api';
import { apiErrorMessage, ConfirmationDialog, useTouchedFields } from '../../utils/form-state';
import { isOptionalAbsoluteUrl, parseNumber } from '../../utils/form-validators';
import { imageFileError, useObjectUrl } from '../../utils/image-file';
import { StatusOptions } from '../admin-info-create/status-options';
import './admin-partner-create.scss';

interface DiscountValue {
  key: number;
  id: string | null;
  title: string;
  description: string;
}

interface PartnerFormValue {
  status: number;
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  websiteUrl: string;
  googleMapsUrl: string;
  latitude: number | null;
  longitude: number | null;
  discounts: DiscountValue[];
}

const PARTNERS_LINK = { pathname: '/admin', search: '?section=partners' };

const PARTNER_STATUS_OPTIONS = [
  { value: 0, modifier: 'draft', label: 'Draft', hint: 'Visible only to logged-in administrators.' },
  { value: 1, modifier: 'published', label: 'Active', hint: 'Visible to everyone.' },
  { value: 2, modifier: 'cancelled', label: 'Inactive', hint: 'Hidden from the public partners list.' },
];

let nextDiscountKey = 0;
const newDiscount = (id: string | null = null, title = '', description = ''): DiscountValue => ({
  key: nextDiscountKey++,
  id,
  title,
  description,
});

function serialize(value: PartnerFormValue): string {
  return JSON.stringify({
    ...value,
    discounts: value.discounts.map(({ id, title, description }) => ({ id, title, description })),
  });
}

function optionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

const discountTitleInvalid = (title: string) => !title || title.length > 200;

export function PartnerEditor({ mode, partnerSlug }: { mode: 'create' | 'edit'; partnerSlug?: string }) {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const objectUrl = useObjectUrl();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fields = useTouchedFields();
  // Create takes several requests (partner, status, offers). Remember what already landed so a
  // retry after a partial failure finishes the job instead of duplicating the partner or offers.
  const createdPartnerIdRef = useRef<string | null>(null);
  const statusAppliedRef = useRef(false);
  const createdDiscountIndexesRef = useRef(new Set<number>());

  const [form, setForm] = useState<PartnerFormValue>({
    status: 0,
    name: '',
    shortDescription: '',
    description: '',
    address: '',
    websiteUrl: '',
    googleMapsUrl: '',
    latitude: null,
    longitude: null,
    discounts: [],
  });
  const [loading, setLoading] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedPartnerId, setLoadedPartnerId] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState(0);
  const [initialDiscountIds, setInitialDiscountIds] = useState<ReadonlySet<string>>(new Set());
  const [initialFormState, setInitialFormState] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [existingLogoPath, setExistingLogoPath] = useState<string | null>(null);
  const [logoChanged, setLogoChanged] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);

  useEffect(() => {
    if (!isEdit || !partnerSlug) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const partner = await adminApi.getPartnerBySlug(partnerSlug);
        const discounts = await adminApi.getPartnerDiscounts(partner.id);
        if (!active) return;
        const loaded: PartnerFormValue = {
          status: partner.status,
          name: partner.name,
          shortDescription: partner.shortDescription,
          description: partner.description,
          address: partner.address ?? '',
          websiteUrl: partner.websiteUrl ?? '',
          googleMapsUrl: partner.googleMapsUrl ?? '',
          latitude: partner.latitude,
          longitude: partner.longitude,
          discounts: discounts.map((discount) => newDiscount(discount.id, discount.title, discount.description)),
        };
        setLoadedPartnerId(partner.id);
        setForm(loaded);
        setInitialStatus(partner.status);
        setInitialDiscountIds(new Set(discounts.map((discount) => discount.id)));
        setExistingLogoPath(partner.logoPath);
        setLogoPreviewUrl(partner.logoPath);
        setInitialFormState(serialize(loaded));
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setLoading(false);
        setLoadFailed(true);
        setError(apiErrorMessage(err, 'The partner could not be loaded.', true));
      }
    })();
    return () => {
      active = false;
    };
  }, [isEdit, partnerSlug]);

  const length = (text: string, max: number) => !text || text.length > max;
  const errors = {
    name: length(form.name, 200),
    shortDescription: length(form.shortDescription, 500),
    description: length(form.description, 5000),
    address: form.address.length > 500,
    websiteUrl: form.websiteUrl.length > 2000 || !isOptionalAbsoluteUrl(form.websiteUrl),
    googleMapsUrl: form.googleMapsUrl.length > 2000 || !isOptionalAbsoluteUrl(form.googleMapsUrl),
    latitude: form.latitude !== null && (form.latitude < -90 || form.latitude > 90),
    longitude: form.longitude !== null && (form.longitude < -180 || form.longitude > 180),
  };
  const coordinatesIncomplete = (form.latitude === null) !== (form.longitude === null);
  const invalid =
    Object.values(errors).some(Boolean) ||
    coordinatesIncomplete ||
    form.discounts.some((discount) => discountTitleInvalid(discount.title) || discount.description.length > 2000);
  const hasChanges =
    !isEdit || logoChanged || (initialFormState !== null && serialize(form) !== initialFormState);

  const update = <K extends keyof PartnerFormValue>(field: K, value: PartnerFormValue[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    fields.markDirty(field);
  };

  const updateDiscount = (key: number, patch: Partial<DiscountValue>) => {
    setForm((current) => ({
      ...current,
      discounts: current.discounts.map((discount) => (discount.key === key ? { ...discount, ...patch } : discount)),
    }));
  };

  const chooseLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    objectUrl.revoke();
    setSelectedLogo(null);
    setLogoPreviewUrl(isEdit ? existingLogoPath : null);
    setLogoError(null);
    setLogoChanged(false);
    if (!file) {
      return;
    }
    const message = imageFileError(file);
    if (message) {
      setLogoError(message);
      input.value = '';
      return;
    }
    setSelectedLogo(file);
    setLogoChanged(true);
    setLogoPreviewUrl(objectUrl.create(file));
  };

  const removeLogo = () => {
    objectUrl.revoke();
    setSelectedLogo(null);
    setLogoPreviewUrl(isEdit ? existingLogoPath : null);
    setLogoError(null);
    setLogoChanged(false);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const missingLogo = !isEdit && !selectedLogo;
    if (invalid || submitting || missingLogo || !hasChanges) {
      fields.touchAll();
      if (missingLogo) {
        setLogoError('Choose a logo image for this partner.');
      }
      return;
    }
    setConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    setConfirmationOpen(false);
    if (invalid || submitting || (!isEdit && !selectedLogo) || !hasChanges) {
      return;
    }

    const request: CreatePartnerRequest = {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      address: optionalText(form.address),
      websiteUrl: optionalText(form.websiteUrl),
      googleMapsUrl: optionalText(form.googleMapsUrl),
      latitude: form.latitude,
      longitude: form.longitude,
    };
    const currentDiscounts = form.discounts
      .map((discount) => ({ id: discount.id, title: discount.title.trim(), description: discount.description.trim() }))
      .filter((discount) => discount.title.length > 0);

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        const partnerId = loadedPartnerId;
        if (!partnerId) {
          setSubmitting(false);
          return;
        }
        await adminApi.updatePartner(partnerId, request, selectedLogo);
        if (form.status !== initialStatus) {
          await adminApi.updatePartnerStatus(partnerId, form.status);
        }
        const existing = currentDiscounts.filter(
          (discount): discount is { id: string; title: string; description: string } => discount.id !== null,
        );
        const currentIds = new Set(existing.map((discount) => discount.id));
        await Promise.all([
          ...currentDiscounts
            .filter((discount) => !discount.id)
            .map(({ title, description }) => adminApi.createDiscount({ title, description, partnerId })),
          ...existing.map(({ id, title, description }) => adminApi.updateDiscount(id, { title, description })),
          ...[...initialDiscountIds].filter((id) => !currentIds.has(id)).map((id) => adminApi.deleteDiscount(id)),
        ]);
      } else {
        if (createdPartnerIdRef.current === null) {
          createdPartnerIdRef.current = (await adminApi.createPartner(request, selectedLogo!)).id;
        }
        const partnerId = createdPartnerIdRef.current;
        if (form.status !== 0 && !statusAppliedRef.current) {
          await adminApi.updatePartnerStatus(partnerId, form.status);
          statusAppliedRef.current = true;
        }
        await Promise.all(
          currentDiscounts
            .map((discount, index) => ({ discount, index }))
            .filter(({ index }) => !createdDiscountIndexesRef.current.has(index))
            .map(async ({ discount, index }) => {
              await adminApi.createDiscount({ title: discount.title, description: discount.description, partnerId });
              createdDiscountIndexesRef.current.add(index);
            }),
        );
      }
      navigate(PARTNERS_LINK);
    } catch (err) {
      setSubmitting(false);
      if (isEdit) {
        setError(apiErrorMessage(err, 'The partner changes could not be saved.', true));
      } else {
        setError(
          createdPartnerIdRef.current !== null
            ? 'The partner was created but some details could not be saved. Save again to finish — this will not create a duplicate.'
            : apiErrorMessage(err, 'The partner could not be created.', true),
        );
      }
    }
  };

  const previewOffers: PartnerOffer[] = form.discounts.map((discount, index) => ({
    id: `discount-preview-${index}`,
    title: discount.title.trim() || 'New discount title',
    description: discount.description.trim(),
    partnerId: 'partner-preview',
    partnerName: null,
  }));

  const textProps = (field: 'name' | 'address' | 'websiteUrl' | 'googleMapsUrl') => ({
    value: form[field],
    className: fields.invalidClass(field, errors[field]),
    onChange: (event: ChangeEvent<HTMLInputElement>) => update(field, event.currentTarget.value),
    onBlur: () => fields.markTouched(field),
  });
  const textareaProps = (field: 'shortDescription' | 'description') => ({
    value: form[field],
    className: fields.invalidClass(field, errors[field]),
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => update(field, event.currentTarget.value),
    onBlur: () => fields.markTouched(field),
  });
  const coordinateProps = (field: 'latitude' | 'longitude') => ({
    type: 'number',
    value: form[field] ?? '',
    className: fields.invalidClass(field, errors[field]),
    onChange: (event: ChangeEvent<HTMLInputElement>) => update(field, parseNumber(event.currentTarget.value)),
    onBlur: () => fields.markTouched(field),
  });
  const showError = (field: keyof typeof errors) => fields.showError(field, errors[field]);

  const editorForm = (
    <form className="partner-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <div>
          <h2>Partner information</h2>
          <p>Fields marked with * are required.</p>
        </div>
        <button type="button" className="preview-toggle" onClick={() => setPreviewVisible((visible) => !visible)}>
          {previewVisible ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      <StatusOptions
        legend="Partner status"
        description="Choose who can see this partner and how it appears."
        value={form.status}
        options={PARTNER_STATUS_OPTIONS}
        onChange={(status) => update('status', status)}
      />

      <label className="field">
        <span>Name *</span>
        <input type="text" maxLength={200} placeholder="For example: Decathlon" {...textProps('name')} />
        <span className="character-count">{form.name.length}/200</span>
        {showError('name') && <small>Enter a partner name (maximum 200 characters).</small>}
      </label>

      <label className="field">
        <span>Short description *</span>
        <AutosizeTextarea
          maxLength={500}
          minRows={3}
          placeholder="A short summary shown on the partners list"
          {...textareaProps('shortDescription')}
        />
        <span className="character-count">{form.shortDescription.length}/500</span>
        {showError('shortDescription') && <small>Enter a short description (maximum 500 characters).</small>}
      </label>

      <label className="field">
        <span>Full description *</span>
        <AutosizeTextarea
          maxLength={5000}
          minRows={6}
          placeholder="Describe the partner and what ESN members can expect"
          {...textareaProps('description')}
        />
        <span className="character-count">{form.description.length}/5000</span>
        {showError('description') && <small>Enter the full partner description (maximum 5,000 characters).</small>}
      </label>

      <div className="field">
        <span>Logo *</span>
        <div className="upload-control">
          <input
            ref={logoInputRef}
            className="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={chooseLogo}
          />
          {logoPreviewUrl && (
            <button type="button" onClick={removeLogo}>
              Remove logo
            </button>
          )}
        </div>
        <span className="field-hint">JPEG, PNG, or WebP, up to 8 MB.</span>
        {logoError && <small>{logoError}</small>}
      </div>

      <label className="field">
        <span>Address</span>
        <input type="text" maxLength={500} placeholder="Street and city" {...textProps('address')} />
        {showError('address') && <small>The address is too long (maximum 500 characters).</small>}
      </label>

      <label className="field">
        <span>Website URL</span>
        <input type="url" maxLength={2000} placeholder="Paste the partner's website link" {...textProps('websiteUrl')} />
        {showError('websiteUrl') && <small>Enter a valid absolute URL.</small>}
      </label>

      <label className="field">
        <span>Google Maps URL</span>
        <input type="url" maxLength={2000} placeholder="Paste a Google Maps link" {...textProps('googleMapsUrl')} />
        {showError('googleMapsUrl') && <small>Enter a valid absolute URL.</small>}
      </label>

      <fieldset className="participant-section">
        <legend>Map coordinates</legend>
        <div className="participant-fields">
          <label className="field">
            <span>Latitude</span>
            <input min="-90" max="90" step="0.000001" {...coordinateProps('latitude')} />
          </label>
          <label className="field">
            <span>Longitude</span>
            <input min="-180" max="180" step="0.000001" {...coordinateProps('longitude')} />
          </label>
        </div>
        {coordinatesIncomplete && (
          <p className="group-error">Provide both latitude and longitude, or leave both empty.</p>
        )}
      </fieldset>

      <fieldset className="discounts-section">
        <legend>Discounts</legend>
        <p>Add one or more discounts ESN members can use at this partner.</p>

        {form.discounts.map((discount, index) => {
          const titleField = `discount-${discount.key}-title`;
          const titleInvalid = discountTitleInvalid(discount.title);
          return (
            <div className="discount-row" key={discount.key}>
              <div className="discount-row__fields">
                <label className="field">
                  <span>Title *</span>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="For example: 10% off all items"
                    value={discount.title}
                    className={fields.invalidClass(titleField, titleInvalid)}
                    onChange={(event) => {
                      updateDiscount(discount.key, { title: event.currentTarget.value });
                      fields.markDirty(titleField);
                    }}
                    onBlur={() => fields.markTouched(titleField)}
                  />
                  <span className="character-count">{discount.title.length}/200</span>
                  {fields.showError(titleField, titleInvalid) && (
                    <small>Enter a discount title (maximum 200 characters).</small>
                  )}
                </label>
                <label className="field">
                  <span>Description</span>
                  <AutosizeTextarea
                    maxLength={2000}
                    minRows={3}
                    placeholder="Explain how members can use this discount"
                    value={discount.description}
                    onChange={(event) => updateDiscount(discount.key, { description: event.currentTarget.value })}
                  />
                  <span className="character-count">{discount.description.length}/2000</span>
                </label>
              </div>
              <button
                type="button"
                className="discount-remove"
                aria-label={`Remove discount ${index + 1}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    discounts: current.discounts.filter((item) => item.key !== discount.key),
                  }))
                }
              >
                Remove
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="add-discount-button"
          onClick={() => setForm((current) => ({ ...current, discounts: [...current.discounts, newDiscount()] }))}
        >
          Add discount
        </button>
      </fieldset>

      {error && (
        <div className="save-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        <Link to={PARTNERS_LINK}>Cancel</Link>
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
              <button type="submit" disabled={invalid || submitting || !selectedLogo}>
                {submitting ? 'Saving…' : 'Create partner'}
              </button>
              {(invalid || !selectedLogo) && <small>Fill in all required fields to continue.</small>}
            </>
          )}
        </div>
      </div>
    </form>
  );

  return (
    <Host tag={isEdit ? 'app-admin-partner-edit' : 'app-admin-partner-create'}>
      <main className="create-page">
        <header className="page-header">
          <div>
            <Link className="back-link" to={PARTNERS_LINK}>
              <span className="back-icon" aria-hidden="true"></span>
              <span>Admin panel</span>
            </Link>
            <p className="eyebrow">Partners administration</p>
            <h1>{isEdit ? 'Edit partner' : 'Create partner'}</h1>
            <p>
              {isEdit
                ? 'Update the partner information and publishing status.'
                : 'Complete the required information and choose the partner status.'}
            </p>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : loadFailed ? (
          <div className="save-error" role="alert">
            <p>{error}</p>
            <Link to={PARTNERS_LINK}>Back to admin panel</Link>
          </div>
        ) : (
          <AdminEditorLayout
            previewVisible={previewVisible}
            form={editorForm}
            preview={
              <AdminPartnerPreview
                partner={{
                  id: loadedPartnerId ?? 'partner-preview',
                  slug: null,
                  name: form.name.trim() || 'New partner name',
                  logoPath: logoPreviewUrl,
                  shortDescription: form.shortDescription.trim() || 'Your short partner description will appear here.',
                  status: form.status,
                  offersCount: previewOffers.length,
                  description: form.description.trim() || 'Your full partner description will appear here as you type.',
                  address: optionalText(form.address),
                  websiteUrl: optionalText(form.websiteUrl),
                  googleMapsUrl: optionalText(form.googleMapsUrl),
                  latitude: form.latitude,
                  longitude: form.longitude,
                  offers: previewOffers,
                }}
              />
            }
          />
        )}

        {confirmationOpen && (
          <ConfirmationDialog
            title={isEdit ? 'Save these changes?' : 'Create this partner?'}
            cancelLabel="Keep editing"
            confirmLabel={isEdit ? 'Yes, save changes' : 'Yes, create partner'}
            busy={submitting}
            onCancel={() => setConfirmationOpen(false)}
            onConfirm={confirmSubmit}
          />
        )}
      </main>
    </Host>
  );
}
