import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Host } from '../../../../shared/host';
import {
  isEmail,
  isPasswordValid,
  PASSWORD_REQUIREMENTS_HINT,
  passwordsMismatch,
} from '../../../../shared/password-validators';
import { adminApi } from '../../data-access/admin-api';
import { apiErrorMessage, ConfirmationDialog, useTouchedFields } from '../../utils/form-state';
import './admin-admin-create.scss';

const ADMINS_LINK = { pathname: '/admin', search: '?section=admins' };

export default function AdminAdminCreate() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { showError, invalidClass, markDirty, markTouched, touchAll } = useTouchedFields();

  const emailInvalid = !email || !isEmail(email) || email.length > 256;
  const passwordInvalid = !isPasswordValid(password);
  const mismatch = passwordsMismatch(password, confirmPassword);
  const formInvalid = emailInvalid || passwordInvalid || !confirmPassword || mismatch;
  const showMismatchError = showError('confirmPassword', mismatch);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (formInvalid || submitting) {
      touchAll();
      return;
    }
    setConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    setConfirmationOpen(false);
    if (formInvalid || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createAdmin(email.trim(), password);
      navigate(ADMINS_LINK);
    } catch (err) {
      setSubmitting(false);
      setError(apiErrorMessage(err, 'The admin account could not be created.'));
    }
  };

  return (
    <Host tag="app-admin-admin-create">
      <main className="create-page">
        <header className="page-header">
          <div>
            <Link className="back-link" to={ADMINS_LINK}>
              <span className="back-icon" aria-hidden="true"></span>
              <span>Admin panel</span>
            </Link>
            <p className="eyebrow">Administrators</p>
            <h1>Create admin</h1>
            <p>Grant another team member administrator access to the ESN Gdańsk app.</p>
          </div>
        </header>

        <form className="admin-form" onSubmit={submit} noValidate>
          <div className="form-heading">
            <div>
              <h2>Administrator details</h2>
              <p>Fields marked with * are required.</p>
            </div>
          </div>

          <label className="field">
            <span>Email *</span>
            <input
              type="email"
              maxLength={256}
              placeholder="name@esngdansk.local"
              autoComplete="off"
              className={invalidClass('email', emailInvalid)}
              value={email}
              onChange={(event) => {
                setEmail(event.currentTarget.value);
                markDirty('email');
              }}
              onBlur={() => markTouched('email')}
            />
            {showError('email', emailInvalid) && <small>Enter a valid email address.</small>}
          </label>

          <label className="field">
            <span>Password *</span>
            <span className="password-input">
              <input
                type={passwordVisible ? 'text' : 'password'}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className={invalidClass('password', passwordInvalid)}
                value={password}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                  markDirty('password');
                }}
                onBlur={() => markTouched('password')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              >
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </span>
            <span className="field-hint">{PASSWORD_REQUIREMENTS_HINT}</span>
            {showError('password', passwordInvalid) && <small>The password does not meet the required criteria.</small>}
          </label>

          <label className="field">
            <span>Confirm password *</span>
            <span className="password-input">
              <input
                type="password"
                placeholder="Repeat the password"
                autoComplete="new-password"
                className={invalidClass('confirmPassword', !confirmPassword, showMismatchError ? 'mismatch' : undefined)}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.currentTarget.value);
                  markDirty('confirmPassword');
                }}
                onBlur={() => markTouched('confirmPassword')}
              />
            </span>
            {showMismatchError && <small>Passwords do not match.</small>}
          </label>

          {error && (
            <div className="save-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-actions">
            <Link to={ADMINS_LINK}>Cancel</Link>
            <div className="save-action">
              <button type="submit" disabled={formInvalid || submitting}>
                {submitting ? 'Creating…' : 'Create admin'}
              </button>
              {formInvalid && <small>Fill in all required fields to continue.</small>}
            </div>
          </div>
        </form>

        {confirmationOpen && (
          <ConfirmationDialog
            title="Create this admin account?"
            message="This grants full administrator access to the ESN Gdańsk app."
            cancelLabel="Keep editing"
            confirmLabel="Yes, create admin"
            busy={submitting}
            onCancel={() => setConfirmationOpen(false)}
            onConfirm={confirmSubmit}
          />
        )}
      </main>
    </Host>
  );
}
