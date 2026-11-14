import { expect, test } from './fixtures';
import { uniqueName } from './helpers';

test('home loads and the navigation reaches Events, Partners and Info', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Welcome to Gdańsk/ })).toBeVisible();

  // Only one of the desktop/mobile navs is displayed per viewport.
  const nav = page.getByRole('navigation', { name: /navigation$/ });
  for (const [label, path, heading] of [
    ['Events', '/events', 'Events'],
    ['Partners', '/partners', 'Partners'],
    ['Info', '/info', 'Info'],
  ]) {
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
});

test('events list opens the details page and Back returns to the list', async ({ page, admin }) => {
  const title = uniqueName('public event');
  await admin.event(title);

  await page.goto('/events');
  await page.getByRole('searchbox', { name: 'Search events' }).fill(title);
  await page.getByRole('link', { name: title }).click();

  await expect(page).toHaveURL(/\/events\/.+/);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(page.getByText('E2E Hall').first()).toBeVisible();

  await page.getByRole('link', { name: 'Back to events' }).click();
  await expect(page).toHaveURL(/\/events(\?.*)?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
});

test('partners list shows the map and opens a partner with its offers', async ({ page }) => {
  await page.goto('/partners');
  await expect(page.getByRole('heading', { level: 1, name: 'Partners' })).toBeVisible();

  const mobile = page.viewportSize()!.width < 768;
  if (mobile) await page.getByRole('tab', { name: 'Map' }).click();
  const map = page.getByRole('application', { name: 'Interactive map of ESN partners' });
  await expect(map).toBeVisible();
  expect((await map.boundingBox())!.height).toBeGreaterThan(150);
  if (mobile) await page.getByRole('tab', { name: 'List' }).click();

  await page.getByRole('link', { name: 'Starbucks' }).click();
  await expect(page).toHaveURL(/\/partners\/.+/);
  await expect(page.getByRole('heading', { level: 1, name: 'Starbucks' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your offers' })).toBeVisible();
  await expect(page.getByText('10% off every order')).toBeVisible();
});

test('info article opens from the list', async ({ page }) => {
  await page.goto('/info');
  await page.getByRole('link', { name: 'What is ESN?' }).click();
  await expect(page).toHaveURL(/\/info\/.+/);
  await expect(page.getByRole('heading', { level: 1, name: 'What is ESN?' })).toBeVisible();
});
