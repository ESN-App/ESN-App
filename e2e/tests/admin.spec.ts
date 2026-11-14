import { expect, Page, test } from '@playwright/test';
import { ADMIN, loginAsAdmin, openAdminSection } from './helpers';

test('anonymous visit to /admin redirects to login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('login with a wrong password shows an error and stays on the login page', async ({ page }) => {
  await page.goto('/auth');
  await page.getByLabel('Email address').fill(ADMIN.email);
  await page.getByLabel('Password', { exact: true }).fill('definitely-wrong-1');
  await page.getByRole('button', { name: 'Log in to admin panel' }).click();

  await expect(page.getByRole('alert')).not.toBeEmpty();
  await expect(page).toHaveURL(/\/auth/);
});

test.describe('admin panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows all section tabs after login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Admin panel' })).toBeVisible();
    for (const name of ['Events', 'News', 'Partners', 'Info', 'Admins', 'Settings']) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
  });

  test('settings tab shows the version card and time zone', async ({ page }) => {
    await openAdminSection(page, 'Settings');
    await expect(page.getByRole('heading', { name: 'Time zone' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Time zone' })).toBeEnabled();
    await expect(page.getByRole('heading', { name: /^(Version|App version)/ })).toBeVisible();
    await expect(page.getByText('API:')).toBeVisible();
  });

  async function searchRow(page: Page, title: string) {
    await page.locator('#admin-section-search').fill(title);
    return page.getByRole('link', { name: title, exact: true });
  }

  test('event: create draft, edit title, delete', async ({ page }) => {
    const title = `E2E admin event ${Date.now()}`;
    const edited = `${title} edited`;

    await openAdminSection(page, 'Events');
    await page.getByRole('link', { name: 'Create new event' }).click();
    await page.getByLabel('Draft').check();
    await page.getByLabel('Title *').fill(title);
    await page.getByLabel('Short description *').fill('Short');
    await page.getByLabel('Full description *').fill('Full');
    await page.getByLabel('Location *').fill('E2E Hall');
    await page.getByLabel('Starts at *').fill('2031-05-20T18:00');
    await page.getByLabel('Price *').fill('0');
    await page.getByRole('button', { name: 'Create event' }).click();
    await page.getByRole('button', { name: 'Yes, create event' }).click();

    await expect(page).toHaveURL(/\/admin\?section=events/);
    await expect(await searchRow(page, title)).toBeVisible();

    await page.getByRole('link', { name: `Edit ${title}` }).click();
    await page.getByLabel('Title *').fill(edited);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.getByRole('button', { name: 'Yes, save changes' }).click();

    await expect(page).toHaveURL(/\/admin\?section=events/);
    await expect(await searchRow(page, edited)).toBeVisible();

    await page.getByRole('button', { name: `Delete ${edited}` }).click();
    await page.getByRole('button', { name: 'Yes, delete event' }).click();
    await expect(page.getByRole('link', { name: edited, exact: true })).toHaveCount(0);
  });

  test('news: create draft and delete', async ({ page }) => {
    const title = `E2E admin news ${Date.now()}`;

    await openAdminSection(page, 'News');
    await page.getByRole('link', { name: 'Create new news article' }).click();
    await page.getByLabel('Draft').check();
    await page.getByLabel('Title *').fill(title);
    await page.getByLabel('Description *').fill('E2E news body');
    await page.getByRole('button', { name: 'Create news article' }).click();
    await page.getByRole('button', { name: 'Yes, create news article' }).click();

    await expect(page).toHaveURL(/\/admin\?section=news/);
    await expect(await searchRow(page, title)).toBeVisible();

    await page.getByRole('button', { name: `Delete ${title}` }).click();
    await page.getByRole('button', { name: 'Yes, delete news article' }).click();
    await expect(page.getByRole('link', { name: title, exact: true })).toHaveCount(0);
  });
});
