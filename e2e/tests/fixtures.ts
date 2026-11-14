import { test as base, expect } from '@playwright/test';
import { AdminApi } from './helpers';

// Console messages that are expected and must not fail a test.
const ALLOWED_CONSOLE_ERRORS: RegExp[] = [
  // Chromium/WebKit log every 4xx response as a console error; the app triggers some on purpose
  // (wrong password -> 401, unknown event id -> 404, duplicate/invalid form -> 400). 5xx is never allowed.
  /status of 4\d\d/,
  /(401|403|404|400) \(/,
  // Third-party assets (seed images from unsplash, map tiles) can be blocked or slow on CI runners.
  /net::ERR_|Failed to load resource: (the network connection was lost|A server with the specified hostname could not be found|Could not connect)/i,
  // Map tiles / WebGL are not available in every headless browser.
  /WebGL|webgl|maplibre/i,
];

export const test = base.extend<{ guard: void; admin: AdminApi }>({
  // Fails any test that logs a console error, throws an uncaught exception or gets an API 5xx.
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (message) => {
        const text = message.text();
        if (message.type() === 'error' && !ALLOWED_CONSOLE_ERRORS.some((rx) => rx.test(text))) {
          problems.push(`console: ${text}`);
        }
      });
      page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
      page.on('response', (response) => {
        if (response.status() >= 500 && new URL(response.url()).pathname.startsWith('/api/')) {
          problems.push(`${response.status()} ${response.request().method()} ${response.url()}`);
        }
      });
      await use();
      expect(problems, 'console errors / API 5xx').toEqual([]);
    },
    { auto: true },
  ],

  // Admin API client that deletes every "E2E ..." record when the test ends, pass or fail.
  admin: async ({ playwright, baseURL }, use) => {
    const context = await playwright.request.newContext({ baseURL });
    const admin = await AdminApi.create(context);
    try {
      await use(admin);
    } finally {
      await admin.purge();
      await context.dispose();
    }
  },
});

export { expect };
