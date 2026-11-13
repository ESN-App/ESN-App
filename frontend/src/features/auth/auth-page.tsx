import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { authApi } from '../../core/auth';
import { authStore } from '../../core/auth-store';
import { HttpError } from '../../core/http';
import { MatIcon, MatSpinner } from '../../shared/components';
import { Host } from '../../shared/host';
import { isEmail } from '../../shared/password-validators';
import './auth-page.scss';

type Field = 'email' | 'password';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<Field, boolean>>({ email: false, password: false });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const emailError = !email ? 'Email is required.' : !isEmail(email) ? 'Enter a valid email address.' : null;
  const passwordError = !password
    ? 'Password is required.'
    : password.length < 8
      ? 'Password must be at least 8 characters.'
      : null;
  const touch = (field: Field) => setTouched((current) => ({ ...current, [field]: true }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (emailError || passwordError || submitting) {
      setTouched({ email: true, password: true });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await authApi.login(email, password);
    } catch (err) {
      setSubmitting(false);
      const body = err instanceof HttpError ? (err.error as { error?: string } | null) : null;
      setError(body?.error ?? 'We could not log you in. Check your details and try again.');
      return;
    }

    if (!authStore.isAdmin) {
      authApi.logout();
      setSubmitting(false);
      setError('This sign-in is reserved for ESN administrators.');
      return;
    }

    const requestedUrl = searchParams.get('returnUrl');
    navigate(requestedUrl?.startsWith('/') ? requestedUrl : '/admin');
  };

  return (
    <Host tag="app-auth-page">
      <section className="auth-page" aria-labelledby="login-title">
        <div className="background-shape background-shape--cyan" aria-hidden="true"></div>
        <div className="background-shape background-shape--pink" aria-hidden="true"></div>
        <div className="background-shape background-shape--orange" aria-hidden="true"></div>
        <div className="background-line background-line--one" aria-hidden="true"></div>
        <div className="background-line background-line--two" aria-hidden="true"></div>

        <Link className="back-link" to="/">
          <MatIcon>arrow_back</MatIcon>
          Back to ESN app
        </Link>

        <div className="auth-card">
          <span className="card-accent card-accent--top" aria-hidden="true"></span>
          <span className="card-accent card-accent--side" aria-hidden="true"></span>

          <header className="auth-header">
            <div className="brand-mark" aria-hidden="true">
              <span className="brand-mark__orbit brand-mark__orbit--cyan"></span>
              <span className="brand-mark__orbit brand-mark__orbit--pink"></span>
              <span className="brand-mark__orbit brand-mark__orbit--orange"></span>
              <span className="brand-mark__center">
                <img src="/images/esnstar.png" alt="" />
              </span>
            </div>

            <p className="eyebrow">Admin access</p>
            <h1 id="login-title">Welcome back</h1>
          </header>

          <form onSubmit={submit} noValidate>
            <div className="field-group">
              <label htmlFor="admin-email">Email address</label>
              <div className={`input-shell${touched.email && emailError ? ' input-shell--invalid' : ''}`}>
                <MatIcon>mail_outline</MatIcon>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="admin@esn.pl"
                  aria-describedby="email-error"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  onBlur={() => touch('email')}
                />
              </div>
              <div className="field-message" id="email-error" aria-live="polite">
                {touched.email && emailError}
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="admin-password">Password</label>
              <div className={`input-shell${touched.password && passwordError ? ' input-shell--invalid' : ''}`}>
                <MatIcon>lock_outline</MatIcon>
                <input
                  id="admin-password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-describedby="password-error"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  onBlur={() => touch('password')}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                >
                  <MatIcon>{passwordVisible ? 'visibility_off' : 'visibility'}</MatIcon>
                </button>
              </div>
              <div className="field-message" id="password-error" aria-live="polite">
                {touched.password && passwordError}
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <MatIcon>error_outline</MatIcon>
                <span>{error}</span>
              </div>
            )}

            <button className="submit-button" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <MatSpinner diameter={20} label="Logging in" />
                  Logging in…
                </>
              ) : (
                <>
                  Log in to admin panel
                  <span className="submit-arrow" aria-hidden="true"></span>
                </>
              )}
            </button>
          </form>

          <p className="access-note">
            <MatIcon>verified_user</MatIcon>
            Administrator accounts are created internally by ESN Gdańsk.
          </p>
        </div>
      </section>
    </Host>
  );
}
