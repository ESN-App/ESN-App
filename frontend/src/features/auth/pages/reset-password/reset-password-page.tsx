import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { authApi } from '../../../../core/auth';
import { HttpError } from '../../../../core/http';
import { Host } from '../../../../shared/host';
import {
  isPasswordValid,
  PASSWORD_REQUIREMENTS_HINT,
  passwordsMismatch,
} from '../../../../shared/password-validators';
import './reset-password-page.scss';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const linkValid = Boolean(email && token);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const passwordInvalid = !isPasswordValid(password);
  const mismatch = passwordsMismatch(password, confirmPassword);
  const formInvalid = passwordInvalid || !confirmPassword || mismatch;
  const showMismatchError = mismatch && confirmTouched;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (formInvalid || submitting || !email || !token) {
      setPasswordTouched(true);
      setConfirmTouched(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword(email, token, password);
      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      setSubmitting(false);
      const body = err instanceof HttpError ? (err.error as { error?: string } | null) : null;
      setError(body?.error ?? 'The password could not be reset. Please try again.');
    }
  };

  return (
    <Host tag="app-reset-password-page">
      <main className="create-page">
        <header className="page-header">
          <div>
            <Link className="back-link" to="/auth">
              <span className="back-icon" aria-hidden="true"></span>
              <span>Back to login</span>
            </Link>
            <p className="eyebrow">Admin access</p>
            <h1>Reset password</h1>
            {linkValid && (
              <p>
                Choose a new password for <strong>{email}</strong>.
              </p>
            )}
          </div>
        </header>

        {!linkValid ? (
          <div className="admin-form">
            <p className="save-error" role="alert">
              This link is invalid. Ask an administrator to send you a new password reset link.
            </p>
          </div>
        ) : submitted ? (
          <div className="admin-form">
            <p className="save-success" role="status">
              Your password has been reset. You can now log in with your new password.
            </p>
            <div className="form-actions">
              <Link to="/auth">Go to login</Link>
            </div>
          </div>
        ) : (
          <form className="admin-form" onSubmit={submit} noValidate>
            <div className="form-heading">
              <div>
                <h2>New password</h2>
                <p>Fields marked with * are required.</p>
              </div>
            </div>

            <label className="field">
              <span>New password *</span>
              <span className="password-input">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.currentTarget.value);
                    setPasswordTouched(true);
                  }}
                  onBlur={() => setPasswordTouched(true)}
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
              {passwordTouched && passwordInvalid && <small>The password does not meet the required criteria.</small>}
            </label>

            <label className="field">
              <span>Confirm new password *</span>
              <span className="password-input">
                <input
                  type="password"
                  placeholder="Repeat the password"
                  autoComplete="new-password"
                  className={showMismatchError ? 'mismatch' : undefined}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.currentTarget.value);
                    setConfirmTouched(true);
                  }}
                  onBlur={() => setConfirmTouched(true)}
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
              <Link to="/auth">Cancel</Link>
              <div className="save-action">
                <button type="submit" disabled={formInvalid || submitting}>
                  {submitting ? 'Resetting…' : 'Reset password'}
                </button>
                {formInvalid && <small>Fill in all required fields to continue.</small>}
              </div>
            </div>
          </form>
        )}
      </main>
    </Host>
  );
}
