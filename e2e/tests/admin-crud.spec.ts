import { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { loginAsAdmin, openAdminSection, PNG, uniqueName } from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

async function searchFor(page: Page, text: string): Promise<void> {
  await page.locator('#admin-section-search').fill(text);
}

const rowLink = (page: Page, title: string) => page.getByRole('link', { name: title, exact: true });

test('partner: create with an offer and logo, edit, delete', async ({ page, admin: _admin }) => {
  const name = uniqueName('partner');
  const renamed = `${name} renamed`;

  await openAdminSection(page, 'Partners');
  await page.getByRole('link', { name: 'Create new partner' }).click();
  await page.getByLabel('Draft').check();
  await page.getByLabel('Name *').fill(name);
  await page.getByLabel('Short description *').fill('E2E short');
  await page.getByLabel('Full description *').fill('E2E full');
  await page.locator('input[type=file]').setInputFiles(PNG);
  await page.getByRole('button', { name: 'Add discount' }).click();
  await page.getByLabel('Title *').fill('E2E 25% off');
  await page.getByRole('button', { name: 'Create partner' }).click();
  await page.getByRole('button', { name: 'Yes, create partner' }).click();

  await expect(page).toHaveURL(/\/admin\?section=partners/);
  await searchFor(page, name);
  await expect(rowLink(page, name)).toBeVisible();

  await page.getByRole('link', { name: `Edit ${name}` }).click();
  await page.getByLabel('Name *').fill(renamed);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Yes, save changes' }).click();
  await expect(page).toHaveURL(/\/admin\?section=partners/);
  await searchFor(page, renamed);
  await expect(rowLink(page, renamed)).toBeVisible();

  await page.getByRole('button', { name: `Delete ${renamed}` }).click();
  await page.getByRole('button', { name: 'Yes, delete partner' }).click();
  await expect(rowLink(page, renamed)).toHaveCount(0);
});

test('info article: create, reorder, delete', async ({ page, admin }) => {
  const first = uniqueName('info A');
  const second = uniqueName('info B');
  await admin.info(second);

  await openAdminSection(page, 'Info');
  await page.getByRole('link', { name: 'Create new article' }).click();
  await page.getByLabel('Title *').fill(first);
  await page.getByLabel('Category *').fill('E2E');
  await page.getByLabel('Content *').fill('E2E content');
  await page.getByText('Published', { exact: true }).click();
  await page.getByRole('button', { name: 'Create article' }).click();
  await page.getByRole('button', { name: 'Yes, create article' }).click();
  await expect(page).toHaveURL(/\/admin\?section=info/);

  const before = await admin.publicInfoTitles();
  const firstWasAbove = before.indexOf(first) < before.indexOf(second);

  await page.getByRole('button', { name: 'Set display order' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.drag-item', { hasText: first }).scrollIntoViewIfNeeded();
  await dialog.locator('.drag-item', { hasText: first }).dragTo(dialog.locator('.drag-item', { hasText: second }));
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  // The modal may ask for a confirmation before saving.
  const confirm = page.getByRole('button', { name: /^Yes, save/ });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await expect(dialog).toBeHidden();

  await expect
    .poll(async () => {
      const after = await admin.publicInfoTitles();
      return after.indexOf(first) < after.indexOf(second);
    })
    .toBe(!firstWasAbove);

  await searchFor(page, first);
  await page.getByRole('button', { name: `Delete ${first}` }).click();
  await page.getByRole('button', { name: 'Yes, delete article' }).click();
  await expect(rowLink(page, first)).toHaveCount(0);
});

test('admin account: create, list, send password reset, delete', async ({ page, admin: _admin }) => {
  const email = `e2e-${Date.now()}@esngdansk.local`;

  await openAdminSection(page, 'Admins');
  await page.getByRole('link', { name: 'Create new admin' }).click();
  await page.getByLabel('First name *').fill('E2E');
  await page.getByLabel('Last name *').fill('Admin');
  await page.getByLabel('Email *').fill(email);
  await page.getByPlaceholder('At least 8 characters').fill('E2eTest123');
  await page.getByPlaceholder('Repeat the password').fill('E2eTest123');
  await page.getByRole('button', { name: 'Create admin' }).click();
  await page.getByRole('button', { name: 'Yes, create admin' }).click();

  await expect(page).toHaveURL(/\/admin\?section=admins/);
  await searchFor(page, email);
  await expect(page.getByRole('cell', { name: email, exact: true })).toBeVisible();

  // SMTP is off in compose, so the backend only logs the mail; the UI still confirms.
  await page.getByRole('button', { name: `Options for ${email}` }).click();
  await page.getByRole('menuitem', { name: 'Reset password' }).click();
  await page.getByRole('button', { name: 'Yes, send link' }).click();
  await expect(page.getByRole('status')).toContainText(`reset link has been sent to ${email}`);

  await page.getByRole('button', { name: `Delete ${email}` }).click();
  await page.getByRole('button', { name: 'Yes, delete admin' }).click();
  await expect(page.getByRole('cell', { name: email, exact: true })).toHaveCount(0);
});

test('event image: upload shows a preview, can be removed and is saved', async ({ page, admin }) => {
  const title = uniqueName('image event');
  const id = await admin.event(title, { status: 0, daysFromNow: 3 });

  await page.goto(`/admin/events/${id}/edit`);
  await expect(page.getByLabel('Title *')).toHaveValue(title);

  const upload = page.locator('input[type=file]');
  await upload.setInputFiles(PNG);
  const remove = page.getByRole('button', { name: 'Remove photo' });
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(remove).toHaveCount(0);

  await upload.setInputFiles(PNG);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Yes, save changes' }).click();
  await expect(page).toHaveURL(/\/admin\?section=events/);
  await expect.poll(() => admin.eventImagePath(id)).toBeTruthy();
});

test('bulk actions: select several events, publish them, delete them', async ({ page, admin }) => {
  const tag = uniqueName('bulk');
  for (const n of [1, 2, 3]) await admin.event(`${tag} ${n}`, { status: 0, daysFromNow: 5 });

  await openAdminSection(page, 'Events');
  await searchFor(page, tag);
  await expect(page.locator('tbody .details-link')).toHaveCount(3);

  await page.getByRole('checkbox', { name: 'Select all events on this page' }).check();
  await expect(page.getByText('3 selected')).toBeVisible();
  await page.getByRole('button', { name: 'Change status' }).click();
  await page.locator('#bulk-events-status').selectOption('1');
  await page.getByRole('dialog').getByRole('button', { name: 'Change status' }).click();
  await expect(page.locator('tbody .draft-row')).toHaveCount(0);

  await page.getByRole('checkbox', { name: 'Select all events on this page' }).check();
  await page.getByRole('button', { name: 'Delete selected' }).click();
  await page.getByRole('button', { name: 'Yes, delete events' }).click();
  await expect(page.locator('tbody .details-link')).toHaveCount(0);
});

test('list tools: search, sort and pagination', async ({ page, admin }) => {
  const tag = uniqueName('list');
  for (let n = 1; n <= 12; n++) await admin.news(`${tag} ${String(n).padStart(2, '0')}`, 0);

  await openAdminSection(page, 'News');
  await searchFor(page, tag);
  await expect(page.getByText('Showing 1–10 of 12')).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Showing 11–12 of 12')).toBeVisible();
  await expect(page.locator('tbody .details-link')).toHaveCount(2);

  await page.getByLabel('Rows per page').selectOption('50');
  await expect(page.locator('tbody .details-link')).toHaveCount(12);

  const titles = () => page.locator('tbody .details-link').allTextContents();
  await page.getByRole('button', { name: 'News item' }).click();
  const ascending = await titles();
  await page.getByRole('button', { name: 'News item' }).click();
  expect(await titles()).toEqual([...ascending].reverse());
  const sorted = [...ascending].sort();
  expect([sorted, [...sorted].reverse()]).toContainEqual(ascending);

  await searchFor(page, `${tag} zzz`);
  await expect(page.getByRole('heading', { name: 'No news found' })).toBeVisible();
});
