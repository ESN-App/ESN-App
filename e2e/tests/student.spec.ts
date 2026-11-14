import { expect, test } from './fixtures';
import { uniqueName } from './helpers';

const monthLabel = (date: Date) =>
  date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });

test('events: month navigation reaches a later month with its event', async ({ page, admin }) => {
  const title = uniqueName('later event');
  const daysFromNow = 40;
  await admin.event(title, { daysFromNow });
  // A second event in the current month, so the list starts earlier than the target month.
  await admin.event(uniqueName('current event'), { daysFromNow: 0 });
  const target = monthLabel(new Date(Date.now() + daysFromNow * 86400_000));

  await page.goto('/events');
  const pill = page.getByRole('button', { name: 'Month', exact: true });
  const next = page.locator('button[aria-label="Show next month"]:not([disabled])');
  // Wait until months are loaded: the next-month button is disabled before that.
  await expect(pill.or(next).filter({ visible: true }).first()).toBeVisible();

  if (await pill.isVisible()) {
    // Mobile: the month picker dialog lists months that have events.
    await pill.click();
    const picker = page.getByRole('dialog', { name: 'Choose month' });
    const [month, year] = [target.split(' ')[0].slice(0, 3), Number(target.split(' ')[1])];
    while (Number(await picker.getByRole('heading', { level: 3 }).textContent()) < year) {
      await picker.getByRole('button', { name: 'Next year' }).click();
    }
    await picker.getByRole('button', { name: month, exact: true }).click();
  } else {
    // Step forward until the target month is shown (the page may already open on it).
    await expect(async () => {
      if ((await page.getByRole('heading', { name: target }).count()) === 0) {
        await next.click({ timeout: 1000 });
      }
      await expect(page.getByRole('heading', { name: target }).first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });
  }
  await expect(page.getByRole('heading', { name: target }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: title })).toBeVisible();
});

test('events: search filters the list and Clear filters restores it', async ({ page, admin }) => {
  const title = uniqueName('search event');
  await admin.event(title);

  await page.goto('/events');
  const search = page.getByRole('searchbox', { name: 'Search events' });
  await search.fill(title);
  await expect(page.getByRole('link', { name: title })).toBeVisible();

  await search.fill(`${title} no such event`);
  await expect(page.getByRole('heading', { name: 'No matching events' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('link', { name: title })).toBeVisible();
});

test('news: a story opens from the home page and Back returns home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Orientation Week is almost here' }).first().click();
  await expect(page).toHaveURL(/\/news\/.+/);
  await expect(page.getByRole('heading', { level: 1, name: 'Orientation Week is almost here' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).first().click();
  await expect(page).toHaveURL(/\/$/);
});

test('news: a published story opens by direct URL, a draft does not', async ({ page, admin }) => {
  const published = uniqueName('published news');
  const draft = uniqueName('draft news');
  const publishedId = await admin.news(published, 1);
  const draftId = await admin.news(draft, 0);

  await page.goto(`/news/${publishedId}`);
  await expect(page.getByRole('heading', { level: 1, name: published })).toBeVisible();

  await page.goto(`/news/${draftId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Story not found' })).toBeVisible();
});

test('a draft event is hidden from anonymous users in the list and by direct URL', async ({ page, admin }) => {
  const title = uniqueName('draft event');
  const id = await admin.event(title, { status: 0 });

  await page.goto('/events');
  await page.getByRole('searchbox', { name: 'Search events' }).fill(title);
  await expect(page.getByRole('link', { name: title })).toHaveCount(0);

  await page.goto(`/events/e2e-draft-${id}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Event not found' })).toBeVisible();
});

test('a non-existent event id shows the not-found state', async ({ page }) => {
  await page.goto('/events/nothing-here-00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('heading', { level: 1, name: 'Event not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to events' }).click();
  await expect(page).toHaveURL(/\/events$/);
});
