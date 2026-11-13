export interface AuthResponse {
  token: string;
  expiresAt: string;
  email: string;
}

interface JwtPayload {
  exp?: number;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
}

export interface AuthSnapshot {
  token: string | null;
  email: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

const TOKEN_KEY = 'esn-app.token';
const EMAIL_KEY = 'esn-app.email';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readPayload(token: string | null): JwtPayload | null {
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

function createSnapshot(token: string | null, email: string | null): AuthSnapshot {
  const payload = readPayload(token);
  const isLoggedIn = payload !== null && (payload.exp === undefined || payload.exp * 1000 > Date.now());
  const roleClaim =
    payload?.role ?? payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const roles = Array.isArray(roleClaim) ? roleClaim : roleClaim ? [roleClaim] : [];

  return {
    token,
    email,
    isLoggedIn,
    isAdmin: isLoggedIn && roles.some((role) => role.toLocaleLowerCase() === 'admin'),
  };
}

type Listener = () => void;

/**
 * Session state (JWT + email) persisted in localStorage. Exposed as an external store so
 * components subscribe through `useAuth()` and non-React code (API clients) reads it directly.
 */
class AuthStore {
  private snapshot = createSnapshot(readStorage(TOKEN_KEY), readStorage(EMAIL_KEY));
  private readonly listeners = new Set<Listener>();

  get token(): string | null {
    return this.snapshot.token;
  }

  get isAdmin(): boolean {
    return this.snapshot.isAdmin;
  }

  get isLoggedIn(): boolean {
    return this.snapshot.isLoggedIn;
  }

  get email(): string | null {
    return this.snapshot.email;
  }

  readonly getSnapshot = (): AuthSnapshot => this.snapshot;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  storeSession(response: AuthResponse): void {
    try {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(EMAIL_KEY, response.email);
    } catch {
      // Storage can be unavailable (private mode); the session still works for this tab.
    }
    this.update(response.token, response.email);
  }

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMAIL_KEY);
    } catch {
      // Ignore storage failures; in-memory state is cleared below.
    }
    this.update(null, null);
  }

  private update(token: string | null, email: string | null): void {
    this.snapshot = createSnapshot(token, email);
    this.listeners.forEach((listener) => listener());
  }
}

export const authStore = new AuthStore();
