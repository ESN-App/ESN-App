import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

const MS_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function jwt(payload: object): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.sig`;
}

const future = () => Math.floor(Date.now() / 1000) + 3600;

function setup(token: string | null) {
  localStorage.clear();
  if (token) localStorage.setItem('esn-app.token', token);
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  return TestBed.inject(AuthService);
}

const runGuard = (guard: typeof authGuard) =>
  TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );

describe('AuthService', () => {
  afterEach(() => localStorage.clear());

  it('treats a token with the short role claim as admin', () => {
    expect(setup(jwt({ role: 'Admin', exp: future() })).isAdmin()).toBe(true);
  });

  it('reads the Microsoft long-form role claim, including arrays and any casing', () => {
    expect(setup(jwt({ [MS_ROLE]: ['User', 'admin'], exp: future() })).isAdmin()).toBe(true);
  });

  it('is logged in but not admin without an admin role', () => {
    const auth = setup(jwt({ role: 'User', exp: future() }));

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isAdmin()).toBe(false);
  });

  it('treats an expired token as logged out and not admin', () => {
    const auth = setup(jwt({ role: 'Admin', exp: Math.floor(Date.now() / 1000) - 10 }));

    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.isAdmin()).toBe(false);
  });

  it('treats a malformed token as logged out', () => {
    expect(setup('not-a-jwt').isLoggedIn()).toBe(false);
  });

  it('logout clears the session', () => {
    const auth = setup(jwt({ role: 'Admin', exp: future() }));

    auth.logout();

    expect(auth.isAdmin()).toBe(false);
    expect(localStorage.getItem('esn-app.token')).toBeNull();
  });
});

describe('route guards', () => {
  afterEach(() => localStorage.clear());

  it('authGuard sends anonymous visitors to /auth', () => {
    setup(null);

    expect((runGuard(authGuard) as UrlTree).toString()).toBe('/auth');
  });

  it('authGuard lets a logged-in user through', () => {
    setup(jwt({ role: 'User', exp: future() }));

    expect(runGuard(authGuard)).toBe(true);
  });

  it('adminGuard sends anonymous visitors to login with a return url', () => {
    setup(null);

    expect(TestBed.inject(Router).serializeUrl(runGuard(adminGuard) as UrlTree)).toBe(
      '/auth?returnUrl=%2Fadmin',
    );
  });

  it('adminGuard sends a non-admin user home', () => {
    setup(jwt({ role: 'User', exp: future() }));

    expect((runGuard(adminGuard) as UrlTree).toString()).toBe('/');
  });

  it('adminGuard lets an admin through', () => {
    setup(jwt({ role: 'Admin', exp: future() }));

    expect(runGuard(adminGuard)).toBe(true);
  });
});
