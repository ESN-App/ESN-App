import { expect, test } from './fixtures';
import { loginAsAdmin, openAdminSection, uniqueName } from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test('event form: empty required fields show errors and block saving', async ({ page }) => {
  await page.goto('/admin/events/new');
  const create = page.getByRole('button', { name: 'Create event' });
  await expect(create).toBeDisabled();

  await page.getByLabel('Title *').focus();
  await page.getByLabel('Short description *').focus();
  await page.getByLabel('Full description *').focus();
  await page.getByLabel('Location *').focus();
  await page.getByLabel('Price *').focus();
  await page.getByLabel('Title *').focus();

  await expect(page.getByText('Enter an event title')).toBeVisible();
  await expect(create).toBeDisabled();
});

test('event form: end before start shows an error and blocks saving', async ({ page }) => {
  await page.goto('/admin/events/new');
  await page.getByLabel('Title *').fill(uniqueName('bad dates'));
  await page.getByLabel('Short description *').fill('Short');
  await page.getByLabel('Full description *').fill('Full');
  await page.getByLabel('Location *').fill('E2E Hall');
  await page.getByLabel('Price *').fill('0');
  await page.getByLabel('Starts at *').fill('2031-05-20T18:00');
  await page.getByLabel('Ends at').fill('2031-05-20T17:00');

  await expect(page.getByText('End time must be later than start time.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create event' })).toBeDisabled();
});

test('admin account form: mismatching passwords are rejected', async ({ page }) => {
  await page.goto('/admin/admins/new');
  await page.getByPlaceholder('At least 8 characters').fill('E2eTest123');
  await page.getByPlaceholder('Repeat the password').fill('Different123');
  await page.getByPlaceholder('Repeat the password').blur();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create admin' })).toBeDisabled();
});

test('delete dialog: Keep leaves the item, confirming removes it', async ({ page, admin }) => {
  const title = uniqueName('delete me');
  await admin.news(title, 0);

  await openAdminSection(page, 'News');
  await page.locator('#admin-section-search').fill(title);
  const row = page.getByRole('link', { name: title, exact: true });

  await page.getByRole('button', { name: `Delete ${title}` }).click();
  await expect(page.getByRole('alertdialog')).toContainText(`delete ${title}`);
  await page.getByRole('button', { name: 'Keep news article' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(row).toBeVisible();

  await page.getByRole('button', { name: `Delete ${title}` }).click();
  await page.getByRole('button', { name: 'Yes, delete news article' }).click();
  await expect(row).toHaveCount(0);
});

test('password reset page rejects an invalid link', async ({ page }) => {
  await page.goto('/auth/reset-password');
  await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('This link is invalid');
});
