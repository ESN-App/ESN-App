import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  expiresAt: string;
  email: string;
}

const TOKEN_KEY = 'esn-app.token';
const EMAIL_KEY = 'esn-app.email';

interface JwtPayload {
  exp?: number;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/auth`;

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly emailSignal = signal<string | null>(localStorage.getItem(EMAIL_KEY));

  readonly isLoggedIn = computed(() => this.isTokenValid(this.tokenSignal()));
  readonly isAdmin = computed(() => {
    const payload = this.readPayload(this.tokenSignal());
    const roleClaim =
      payload?.role ?? payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const roles = Array.isArray(roleClaim) ? roleClaim : roleClaim ? [roleClaim] : [];

    return this.isLoggedIn() && roles.some((role) => role.toLocaleLowerCase() === 'admin');
  });
  readonly email = this.emailSignal.asReadonly();

  get token(): string | null {
    return this.tokenSignal();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, { email, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    this.tokenSignal.set(null);
    this.emailSignal.set(null);
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(EMAIL_KEY, response.email);
    this.tokenSignal.set(response.token);
    this.emailSignal.set(response.email);
  }

  private isTokenValid(token: string | null): boolean {
    const payload = this.readPayload(token);

    return payload !== null && (payload.exp === undefined || payload.exp * 1000 > Date.now());
  }

  private readPayload(token: string | null): JwtPayload | null {
    if (!token) {
      return null;
    }

    try {
      const encodedPayload = token.split('.')[1];

      if (!encodedPayload) {
        return null;
      }

      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = decodeURIComponent(
        atob(base64)
          .split('')
          .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      );

      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }
}
