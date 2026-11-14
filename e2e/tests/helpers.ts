import { APIRequestContext, Page, expect } from '@playwright/test';

// Seeded by the backend when it starts with the compose defaults (see .env.example).
export const ADMIN = { email: 'admin@esngdansk.local', password: 'Admin123!' };

/** Every record the suite creates is named "E2E ..." (admins: "e2e-...") so cleanup can find leftovers. */
export const PREFIX = 'E2E';

// 1x1 transparent PNG, enough for the image upload inputs.
export const PNG = {
  name: 'e2e.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  ),
};

export function uniqueName(label: string): string {
  return `${PREFIX} ${label} ${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

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

/** Admin REST client used to arrange data quickly and to clean up after UI tests. */
export class AdminApi {
  private constructor(
    private readonly api: APIRequestContext,
    private readonly headers: Record<string, string>,
  ) {}

  static async create(api: APIRequestContext): Promise<AdminApi> {
    const login = await api.post('/api/auth/login', { data: ADMIN });
    expect(login.ok()).toBeTruthy();
    return new AdminApi(api, { Authorization: `Bearer ${(await login.json()).token}` });
  }

  private async post(url: string, multipart: Record<string, string | typeof PNG>): Promise<string> {
    const response = await this.api.post(url, { headers: this.headers, multipart });
    expect(response.ok(), await response.text()).toBeTruthy();
    return (await response.json()).id;
  }

  private async setStatus(url: string, status: number) {
    const response = await this.api.patch(url, { headers: this.headers, data: { status } });
    expect(response.ok()).toBeTruthy();
  }

  /** Event starting in `daysFromNow` days (status 0 draft, 1 published). */
  async event(title: string, { status = 1, daysFromNow = 0, image = false } = {}): Promise<string> {
    const startsAt = new Date(Date.now() + daysFromNow * 86400_000 + 2 * 3600_000).toISOString();
    const id = await this.post('/api/admin/events', {
      Title: title,
      ShortDescription: 'E2E short description',
      Description: 'E2E full description',
      Location: 'E2E Hall',
      StartsAt: startsAt,
      Price: '0',
      ...(image ? { Image: PNG } : {}),
    });
    if (status !== 0) await this.setStatus(`/api/admin/events/${id}`, status);
    return id;
  }

  async news(title: string, status = 1): Promise<string> {
    const id = await this.post('/api/admin/news', { Title: title, Description: 'E2E news body' });
    if (status !== 0) await this.setStatus(`/api/admin/news/${id}/status`, status);
    return id;
  }

  async info(title: string, status = 1): Promise<string> {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = await this.post('/api/admin/info', {
      Title: title,
      Slug: slug,
      Content: 'E2E info content',
      Category: 'E2E',
    });
    if (status !== 0) await this.setStatus(`/api/admin/info/${id}/status`, status);
    return id;
  }

  async adminAccount(email: string, password = 'E2eTest123'): Promise<void> {
    const response = await this.api.post('/api/admin/admins', {
      headers: this.headers,
      data: { email, password, firstName: 'E2E', lastName: 'Admin' },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
  }

  async eventImagePath(id: string): Promise<string | null> {
    const response = await this.api.get(`/api/admin/events/${id}`, { headers: this.headers });
    return (await response.json()).imagePath;
  }

  async publicInfoTitles(): Promise<string[]> {
    const response = await this.api.get('/api/info');
    return (await response.json()).map((article: { title: string }) => article.title);
  }

  /** Deletes everything the suite may have left behind. */
  async purge(): Promise<void> {
    const targets: [string, (item: any) => string | undefined, (item: any) => string][] = [
      ['events', (e) => e.title, (e) => e.id],
      ['news', (n) => n.title, (n) => n.id],
      ['info', (i) => i.title, (i) => i.id],
      ['partners', (p) => p.name, (p) => p.id],
      ['admins', (a) => a.email, (a) => a.id],
    ];
    for (const [path, name, id] of targets) {
      const url = path === 'events' ? '/api/admin/events?pageSize=100' : `/api/admin/${path}`;
      const body = await (await this.api.get(url, { headers: this.headers })).json();
      const items: any[] = Array.isArray(body) ? body : body.items;
      for (const item of items) {
        const label = name(item) ?? '';
        if (label.startsWith(PREFIX) || label.startsWith('e2e-')) {
          await this.api.delete(`/api/admin/${path}/${id(item)}`, { headers: this.headers });
        }
      }
    }
  }
}
