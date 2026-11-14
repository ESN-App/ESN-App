import { APIRequestContext, Page, expect } from '@playwright/test';

// Seeded by the backend when it starts with the compose defaults (see .env.example).
export const ADMIN = { email: 'admin@esngdansk.local', password: 'Admin123!' };

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/auth');
  await page.getByLabel('Email address').fill(ADMIN.email);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Log in to admin panel' }).click();
  await expect(page).not.toHaveURL(/\/auth/);
}

export async function openAdminSection(page: Page, section: string): Promise<void> {
  await page.goto('/admin');
  await page.getByRole('tab', { name: section, exact: true }).click();
}

async function adminHeaders(api: APIRequestContext) {
  const login = await api.post('/api/auth/login', { data: ADMIN });
  return { Authorization: `Bearer ${(await login.json()).token}` };
}

/** Creates a published event through the admin API; returns its id for cleanup. */
export async function createPublishedEvent(api: APIRequestContext, title: string): Promise<string> {
  const headers = await adminHeaders(api);
  const created = await api.post('/api/admin/events', {
    headers,
    multipart: {
      Title: title,
      ShortDescription: 'E2E short description',
      Description: 'E2E full description',
      Location: 'E2E Hall',
      StartsAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
      Price: '0',
    },
  });
  expect(created.ok()).toBeTruthy();
  const { id } = await created.json();
  const published = await api.patch(`/api/admin/events/${id}`, { headers, data: { status: 1 } });
  expect(published.ok()).toBeTruthy();
  return id;
}

export async function deleteEvent(api: APIRequestContext, id: string): Promise<void> {
  await api.delete(`/api/admin/events/${id}`, { headers: await adminHeaders(api) });
}
