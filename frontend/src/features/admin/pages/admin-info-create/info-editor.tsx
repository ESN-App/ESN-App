import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { Host } from '../../../../shared/host';
import { createInfoSlug } from '../../../info/utils/info-url';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminInfoPreview } from '../../components/admin-preview-panel/admin-preview-panel';
import { AutosizeTextarea } from '../../components/autosize-textarea';
import { adminApi, type CreateInfoArticleRequest } from '../../data-access/admin-api';
import { apiErrorMessage, ConfirmationDialog, useTouchedFields } from '../../utils/form-state';
import { isOptionalAbsoluteUrl, SLUG_PATTERN } from '../../utils/form-validators';
import { imageFileError, useObjectUrl } from '../../utils/image-file';
import { StatusOptions } from './status-options';
import './admin-info-create.scss';

interface ExternalLink {
  key: number;
  value: string;
}

interface InfoFormValue {
  status: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  externalLinks: ExternalLink[];
}

const INFO_LINK = { pathname: '/admin', search: '?section=info' };
const MAX_LINKS = 20;

let nextLinkKey = 0;
const newLink = (value = ''): ExternalLink => ({ key: nextLinkKey++, value });

/** Serialized without the React keys, so re-adding the same links counts as unchanged. */
function serialize(value: InfoFormValue): string {
  return JSON.stringify({ ...value, externalLinks: value.externalLinks.map((link) => link.value) });
}

const linkInvalid = (value: string) => !value || value.length > 2000 || !isOptionalAbsoluteUrl(value);

export function InfoEditor({ mode, infoId }: { mode: 'create' | 'edit'; infoId?: string }) {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const objectUrl = useObjectUrl();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const createdIdRef = useRef<string | null>(null);
  const fields = useTouchedFields();

  const [form, setForm] = useState<InfoFormValue>({
    status: 0,
    title: '',
    slug: '',
    category: '',
    content: '',
    externalLinks: [],
  });
  const [loading, setLoading] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState(0);
  const [initialFormState, setInitialFormState] = useState<string | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !infoId) {
      return;
    }
    let active = true;
    adminApi.getInfoArticle(infoId).then(
      (article) => {
        if (!active) return;
        const loaded: InfoFormValue = {
          status: article.status,
          title: article.title,
          slug: article.slug,
          category: article.category,
          content: article.content,
          externalLinks: article.externalLinks.map((link) => newLink(link)),
        };
        setForm(loaded);
        setCurrentImagePath(article.imagePath);
        setInitialStatus(article.status);
        setInitialFormState(serialize(loaded));
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setLoading(false);
        setLoadFailed(true);
        setError(apiErrorMessage(err, 'The article could not be loaded.', true));
      },
    );
    return () => {
      active = false;
    };
  }, [isEdit, infoId]);

  const errors = {
    title: !form.title || form.title.length > 200,
    slug: !form.slug || form.slug.length > 200 || !SLUG_PATTERN.test(form.slug),
    category: !form.category || form.category.length > 100,
    content: !form.content || form.content.length > 50_000,
  };
  const invalid = Object.values(errors).some(Boolean) || form.externalLinks.some((link) => linkInvalid(link.value));
  const hasChanges =
    !isEdit || selectedImage !== null || (initialFormState !== null && serialize(form) !== initialFormState);

  const update = <K extends keyof InfoFormValue>(field: K, value: InfoFormValue[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    fields.markDirty(field);
  };

  const updateTitle = (title: string) => {
    fields.markDirty('title');
    setForm((current) => ({
      ...current,
      title,
      // Until the slug is edited by hand it follows the title (create only, like Angular).
      slug: !isEdit && !fields.isDirty('slug') ? createInfoSlug(title) : current.slug,
    }));
  };

  const updateLink = (key: number, value: string) => {
    fields.markDirty(`link-${key}`);
    setForm((current) => ({
      ...current,
      externalLinks: current.externalLinks.map((link) => (link.key === key ? { ...link, value } : link)),
    }));
  };

  const addExternalLink = () => {
    if (form.externalLinks.length >= MAX_LINKS) {
      return;
    }
    setForm((current) => ({ ...current, externalLinks: [...current.externalLinks, newLink()] }));
  };

  const removeExternalLink = (key: number) =>
    setForm((current) => ({ ...current, externalLinks: current.externalLinks.filter((link) => link.key !== key) }));

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    objectUrl.revoke();
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageError(null);
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
    setImagePreviewUrl(objectUrl.create(file));
  };

  const removeImage = () => {
    objectUrl.revoke();
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageError(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const missingImage = !isEdit && !selectedImage;
    if (invalid || submitting || missingImage || !hasChanges) {
      fields.touchAll();
      if (missingImage) {
        setImageError('Choose an image for this article.');
      }
      return;
    }
    setConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    setConfirmationOpen(false);
    if (invalid || submitting || (!isEdit && !selectedImage) || !hasChanges) {
      return;
    }

    const request: CreateInfoArticleRequest = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      content: form.content.trim(),
      category: form.category.trim(),
      externalLinks: form.externalLinks.map((link) => link.value.trim()).filter((link) => link.length > 0),
    };
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && infoId) {
        await adminApi.updateInfo(infoId, request, selectedImage);
        if (form.status !== initialStatus) {
          await adminApi.updateInfoStatus(infoId, form.status);
        }
      } else {
        if (createdIdRef.current === null) {
          createdIdRef.current = (await adminApi.createInfo(request, selectedImage!)).id;
        }
        if (form.status !== 0) {
          await adminApi.updateInfoStatus(createdIdRef.current, form.status);
        }
      }
      navigate(INFO_LINK);
    } catch (err) {
      setSubmitting(false);
      if (isEdit) {
        setError(apiErrorMessage(err, 'The article changes could not be saved.', true));
      } else {
        setError(
          createdIdRef.current !== null
            ? 'The info article was created but could not be published. Save again to retry publishing — this will not create a duplicate.'
            : apiErrorMessage(err, 'The info article could not be created.', true),
        );
      }
    }
  };

  const previewId = infoId ?? 'info-preview';
  const previewTitle = form.title.trim() || 'New article title';
  const previewContent = form.content.trim() || 'The article content will appear here as you type.';
  const displayedImagePath = imagePreviewUrl ?? (isEdit ? currentImagePath : null);

  const textField = (field: 'title' | 'slug' | 'category') => ({
    value: form[field],
    className: fields.invalidClass(field, errors[field]),
    onBlur: () => fields.markTouched(field),
  });

  const editorForm = (
    <form className="info-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <div>
          <h2>Article information</h2>
          <p>Fields marked with * are required.</p>
        </div>
        <button type="button" className="preview-toggle" onClick={() => setPreviewVisible((visible) => !visible)}>
          {previewVisible ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      <StatusOptions
        legend="Article status"
        description="Choose who can see this article."
        value={form.status}
        onChange={(status) => update('status', status)}
      />

      <label className="field">
        <span>Title *</span>
        <input
          type="text"
          maxLength={200}
          placeholder="For example: Registering your stay"
          {...textField('title')}
          onChange={(event) => updateTitle(event.currentTarget.value)}
        />
        <span className="character-count">{form.title.length}/200</span>
        {fields.showError('title', errors.title) && <small>Enter an article title (maximum 200 characters).</small>}
      </label>

      <label className="field">
        <span>Slug *</span>
        <input
          type="text"
          maxLength={200}
          placeholder="registering-your-stay"
          {...textField('slug')}
          onChange={(event) => update('slug', event.currentTarget.value)}
        />
        <span className="field-hint">Lowercase letters, numbers, and hyphens only.</span>
        {fields.showError('slug', errors.slug) && (
          <small>Enter a valid slug (lowercase letters, numbers, and hyphens).</small>
        )}
      </label>

      <label className="field">
        <span>Category *</span>
        <input
          type="text"
          maxLength={100}
          placeholder="For example: Housing"
          {...textField('category')}
          onChange={(event) => update('category', event.currentTarget.value)}
        />
        {fields.showError('category', errors.category) && <small>Enter a category (maximum 100 characters).</small>}
      </label>

      <label className="field">
        <span>Content *</span>
        <AutosizeTextarea
          maxLength={50000}
          minRows={6}
          placeholder="Write the full article content"
          value={form.content}
          className={fields.invalidClass('content', errors.content)}
          onChange={(event) => update('content', event.currentTarget.value)}
          onBlur={() => fields.markTouched('content')}
        />
        <span className="character-count">{form.content.length}/50000</span>
        {fields.showError('content', errors.content) && (
          <small>Enter the article content (maximum 50,000 characters).</small>
        )}
      </label>

      <div className="field">
        <span>{isEdit ? 'Image' : 'Image *'}</span>
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
              {isEdit ? 'Undo replacement' : 'Remove image'}
            </button>
          )}
        </div>
        <span className="field-hint">
          {isEdit
            ? 'JPEG, PNG, or WebP, up to 8 MB. Leave empty to keep the current image.'
            : 'JPEG, PNG, or WebP, up to 8 MB.'}
        </span>
        {imageError && <small>{imageError}</small>}
      </div>

      <fieldset className="discounts-section">
        <legend>External links</legend>
        <p>Add links members can open for more information (optional, up to 20).</p>

        {form.externalLinks.map((link, index) => {
          const field = `link-${link.key}`;
          const linkError = linkInvalid(link.value);
          return (
            <div className="discount-row" key={link.key}>
              <div className="discount-row__fields">
                <label className="field">
                  <span>Link {index + 1} *</span>
                  <input
                    type="url"
                    maxLength={2000}
                    placeholder="https://example.com"
                    value={link.value}
                    className={fields.invalidClass(field, linkError)}
                    onChange={(event) => updateLink(link.key, event.currentTarget.value)}
                    onBlur={() => fields.markTouched(field)}
                  />
                  {fields.showError(field, linkError) && <small>Enter a valid absolute URL.</small>}
                </label>
              </div>
              <button
                type="button"
                className="discount-remove"
                aria-label={`Remove link ${index + 1}`}
                onClick={() => removeExternalLink(link.key)}
              >
                Remove
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="add-discount-button"
          disabled={form.externalLinks.length >= MAX_LINKS}
          onClick={addExternalLink}
        >
          Add link
        </button>
      </fieldset>

      {error && (
        <div className="save-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        <Link to={INFO_LINK}>Cancel</Link>
        <div className="save-action">
          <button type="submit" disabled={invalid || submitting || !hasChanges}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create article'}
          </button>
          {isEdit
            ? !hasChanges && <small>No changes to save yet.</small>
            : invalid && <small>Fill in all required fields to continue.</small>}
        </div>
      </div>
    </form>
  );

  return (
    <Host tag={isEdit ? 'app-admin-info-edit' : 'app-admin-info-create'}>
      <main className="create-page">
        <header className="page-header">
          <div>
            <Link className="back-link" to={INFO_LINK}>
              <span className="back-icon" aria-hidden="true"></span>
              <span>Admin panel</span>
            </Link>
            <p className="eyebrow">Info administration</p>
            <h1>{isEdit ? 'Edit info article' : 'Create info article'}</h1>
            <p>
              {isEdit
                ? 'Update the article information and publishing status.'
                : 'Complete the required information and choose the article status.'}
            </p>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : loadFailed ? (
          <div className="save-error" role="alert">
            <p>{error}</p>
            <Link to={INFO_LINK}>Back to admin panel</Link>
          </div>
        ) : (
          <AdminEditorLayout
            previewVisible={previewVisible}
            form={editorForm}
            preview={
              <AdminInfoPreview
                listItem={{
                  id: previewId,
                  title: previewTitle,
                  slug: form.slug.trim() || null,
                  content: previewContent,
                  imagePath: displayedImagePath,
                  status: form.status,
                }}
                details={{
                  id: previewId,
                  title: previewTitle,
                  content: previewContent,
                  imagePath: displayedImagePath,
                  externalLinks: form.externalLinks.map((link) => link.value.trim()).filter((link) => link.length > 0),
                  status: form.status,
                }}
              />
            }
          />
        )}

        {confirmationOpen && (
          <ConfirmationDialog
            title={isEdit ? 'Save these changes?' : 'Create this article?'}
            cancelLabel="Keep editing"
            confirmLabel={isEdit ? 'Yes, save changes' : 'Yes, create article'}
            busy={submitting}
            onCancel={() => setConfirmationOpen(false)}
            onConfirm={confirmSubmit}
          />
        )}
      </main>
    </Host>
  );
}
