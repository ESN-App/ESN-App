import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { Host } from '../../../../shared/host';
import { AdminEditorLayout } from '../../components/admin-editor-layout/admin-editor-layout';
import { AdminNewsPreview } from '../../components/admin-preview-panel/admin-preview-panel';
import { AutosizeTextarea } from '../../components/autosize-textarea';
import { adminApi, type CreateNewsItemRequest } from '../../data-access/admin-api';
import { apiErrorMessage, ConfirmationDialog, useTouchedFields } from '../../utils/form-state';
import { imageFileError, useObjectUrl } from '../../utils/image-file';
import { StatusOptions } from '../admin-info-create/status-options';
import '../admin-info-create/admin-info-create.scss';

interface NewsFormValue {
  status: number;
  title: string;
  description: string;
}

const NEWS_LINK = { pathname: '/admin', search: '?section=news' };

export function NewsEditor({ mode, newsId }: { mode: 'create' | 'edit'; newsId?: string }) {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const objectUrl = useObjectUrl();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const createdIdRef = useRef<string | null>(null);
  const fields = useTouchedFields();

  const [form, setForm] = useState<NewsFormValue>({ status: 0, title: '', description: '' });
  const [loading, setLoading] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState(0);
  const [initialFormState, setInitialFormState] = useState<string | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [now] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (!isEdit || !newsId) {
      return;
    }
    let active = true;
    adminApi.getNewsItem(newsId).then(
      (item) => {
        if (!active) return;
        const loaded = { status: item.status, title: item.title, description: item.description };
        setForm(loaded);
        setCurrentImagePath(item.imagePath || null);
        setCreatedAt(item.createdAt);
        setInitialStatus(item.status);
        setInitialFormState(JSON.stringify(loaded));
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setLoading(false);
        setLoadFailed(true);
        setError(apiErrorMessage(err, 'The news article could not be loaded.', true));
      },
    );
    return () => {
      active = false;
    };
  }, [isEdit, newsId]);

  const errors = {
    title: !form.title || form.title.length > 200,
    description: !form.description || form.description.length > 2000,
  };
  const invalid = errors.title || errors.description;
  const hasChanges =
    !isEdit || selectedImage !== null || (initialFormState !== null && JSON.stringify(form) !== initialFormState);

  const update = <K extends keyof NewsFormValue>(field: K, value: NewsFormValue[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    fields.markDirty(field);
  };

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
        setImageError('Choose an image for this news article.');
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

    const request: CreateNewsItemRequest = { title: form.title.trim(), description: form.description.trim() };
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && newsId) {
        await adminApi.updateNews(newsId, request, selectedImage);
        if (form.status !== initialStatus) {
          await adminApi.updateNewsStatus(newsId, form.status);
        }
      } else {
        if (createdIdRef.current === null) {
          createdIdRef.current = (await adminApi.createNews(request, selectedImage!)).id;
        }
        if (form.status !== 0) {
          await adminApi.updateNewsStatus(createdIdRef.current, form.status);
        }
      }
      navigate(NEWS_LINK);
    } catch (err) {
      setSubmitting(false);
      if (isEdit) {
        setError(apiErrorMessage(err, 'The news article changes could not be saved.', true));
      } else {
        setError(
          createdIdRef.current !== null
            ? 'The news article was created but could not be published. Save again to retry publishing — this will not create a duplicate.'
            : apiErrorMessage(err, 'The news article could not be created.', true),
        );
      }
    }
  };

  const previewTitle = form.title.trim() || 'New article title';
  const displayedImagePath = imagePreviewUrl ?? (isEdit ? currentImagePath : null);
  const previewId = newsId ?? 'news-preview';

  const editorForm = (
    <form className="info-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <div>
          <h2>News article information</h2>
          <p>Fields marked with * are required.</p>
        </div>
        <button type="button" className="preview-toggle" onClick={() => setPreviewVisible((visible) => !visible)}>
          {previewVisible ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      <StatusOptions
        legend="News article status"
        description="Choose who can see this news article."
        value={form.status}
        onChange={(status) => update('status', status)}
      />

      <label className="field">
        <span>Title *</span>
        <input
          type="text"
          maxLength={200}
          placeholder="For example: Orientation Week is almost here"
          value={form.title}
          className={fields.invalidClass('title', errors.title)}
          onChange={(event) => update('title', event.currentTarget.value)}
          onBlur={() => fields.markTouched('title')}
        />
        <span className="character-count">{form.title.length}/200</span>
        {fields.showError('title', errors.title) && <small>Enter a news article title (maximum 200 characters).</small>}
      </label>

      <label className="field">
        <span>Description *</span>
        <AutosizeTextarea
          maxLength={2000}
          minRows={6}
          placeholder="Write the news article description"
          value={form.description}
          className={fields.invalidClass('description', errors.description)}
          onChange={(event) => update('description', event.currentTarget.value)}
          onBlur={() => fields.markTouched('description')}
        />
        <span className="character-count">{form.description.length}/2000</span>
        {fields.showError('description', errors.description) && (
          <small>Enter the news article description (maximum 2,000 characters).</small>
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

      {error && (
        <div className="save-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        <Link to={NEWS_LINK}>Cancel</Link>
        <div className="save-action">
          <button type="submit" disabled={invalid || submitting || !hasChanges}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create news article'}
          </button>
          {invalid ? (
            <small>Fill in all required fields to continue.</small>
          ) : (
            isEdit && !hasChanges && <small>Make a change to enable saving.</small>
          )}
        </div>
      </div>
    </form>
  );

  return (
    <Host tag={isEdit ? 'app-admin-news-edit' : 'app-admin-news-create'}>
      <main className="create-page">
        <header className="page-header">
          <div>
            <Link className="back-link" to={NEWS_LINK}>
              <span className="back-icon" aria-hidden="true"></span>
              <span>Admin panel</span>
            </Link>
            <p className="eyebrow">News administration</p>
            <h1>{isEdit ? 'Edit news article' : 'Create news article'}</h1>
            <p>
              {isEdit
                ? 'Update the news article information and publishing status.'
                : 'Complete the required information and choose the news article status.'}
            </p>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : loadFailed ? (
          <div className="save-error" role="alert">
            <p>{error}</p>
            <Link to={NEWS_LINK}>Back to admin panel</Link>
          </div>
        ) : (
          <AdminEditorLayout
            previewVisible={previewVisible}
            form={editorForm}
            preview={
              <AdminNewsPreview
                listItem={{ id: previewId, title: previewTitle, imagePath: displayedImagePath, status: form.status }}
                details={{
                  id: previewId,
                  title: previewTitle,
                  description:
                    form.description.trim() || 'The news article description will appear here as you type.',
                  imagePath: displayedImagePath,
                  createdAt: isEdit ? createdAt : now,
                  status: form.status,
                }}
              />
            }
          />
        )}

        {confirmationOpen && (
          <ConfirmationDialog
            title={isEdit ? 'Save these changes?' : 'Create this news article?'}
            cancelLabel="Keep editing"
            confirmLabel={isEdit ? 'Yes, save changes' : 'Yes, create news article'}
            busy={submitting}
            onCancel={() => setConfirmationOpen(false)}
            onConfirm={confirmSubmit}
          />
        )}
      </main>
    </Host>
  );
}
