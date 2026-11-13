import { useSyncExternalStore } from 'react';
import { authStore, type AuthResponse, type AuthSnapshot } from './auth-store';
import { http } from './http';

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>('/api/auth/login', { email, password });
    authStore.storeSession(response);
    return response;
  },

  resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    return http.post<void>('/api/auth/reset-password', { email, token, newPassword });
  },

  logout(): void {
    authStore.logout();
  },
};
