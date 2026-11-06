async (page) => {
  const ONLY = globalThis.__ONLY;
  const OUT = '/Users/mac/Desktop/Claude/ESN-App/.playwright-mcp/qa/';
  const B = 'http://localhost:4200';
  const routes = [
    ['home', '/'],
    ['events', '/events'],
    ['event-details', '/events/sunset-kayak-on-the-motlawa-01a1adb0-8c06-755e-8fcd-45a827ec685f'],
    ['event-details-free', '/events/beach-volleyball-kickoff-01a1adb0-8bf0-7f45-af4e-23763893792f'],
    ['partners', '/partners'],
    ['partner-details', '/partners/mcdonalds'],
    ['info', '/info'],
    ['info-article', '/info/what-is-esn'],
    ['news-details', '/news/01a1adb0-8c73-76e5-8650-60b66a9d2c72'],
    ['reset-password', '/auth/reset-password?token=abc&email=student%40example.com'],
  ];
  const log = [];
  const browser = await page.context().browser().browserType().launch({ headless: true, channel: 'chrome' });
  for (const fake of [false, true]) {
    for (const [vw, vh, vname] of [[390, 844, 'm'], [1280, 800, 'd']]) {
      for (const theme of ['light', 'dark']) {
        if (fake && theme === 'dark' && vname === 'd') continue;
        if (ONLY && ONLY !== `${fake}-${vname}-${theme}`) continue;
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, serviceWorkers: 'block', timezoneId: 'Europe/Warsaw' });
        await ctx.addInitScript((t) => { try { localStorage.setItem('esn-app.theme', t); } catch {} }, theme);
        const p = await ctx.newPage();
        if (fake) await p.clock.setFixedTime(new Date('2026-07-06T10:00:00+02:00'));
        p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('Service Worker')) log.push(`[${vname}-${theme}${fake ? '-fake' : ''}] ${m.type()}: ${m.text().slice(0, 200)} @ ${p.url()}`); });
        p.on('pageerror', (e) => log.push(`[pageerror] ${e.message} @ ${p.url()}`));
        const list = fake ? routes.filter(r => ['home', 'events', 'event-details', 'event-details-free'].includes(r[0])) : routes;
        for (const [name, path] of list) {
          await p.goto(B + path, { waitUntil: 'networkidle' });
          await p.waitForTimeout(600);
          const tag = `${vname}-${theme}${fake ? '-jul6' : ''}-${name}`;
          const sx = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
          if (sx) log.push(`HSCROLL ${tag}`);
          await p.screenshot({ path: OUT + tag + '-fold.png' });
          const extra = await p.evaluate(() => { const m = document.querySelector('main.content'); return m ? m.scrollHeight - m.clientHeight : 0; });
          const hx = await p.evaluate(() => { const m = document.querySelector('main.content'); return m ? m.scrollWidth > m.clientWidth : false; });
          if (hx) log.push(`HSCROLL-main ${tag}`);
          if (extra > 0) { await p.setViewportSize({ width: vw, height: vh + extra }); await p.waitForTimeout(400); }
          await p.screenshot({ path: OUT + tag + '.png' });
          await p.setViewportSize({ width: vw, height: vh });
          if (name === 'partners' && vname === 'm') {
            const btn = p.getByRole('button', { name: /map/i }).or(p.getByRole('radio', { name: /map/i })).or(p.getByRole('tab', { name: /map/i })).first();
            if (await btn.count()) { await btn.click(); await p.waitForTimeout(1500); await p.screenshot({ path: OUT + tag + '-map.png', fullPage: true }); }
            else log.push('no map toggle found ' + tag);
          }
        }
        if (!fake) {
          // error state
          await p.route('**/api/events**', (r) => r.fulfill({ status: 500, body: 'x' }));
          await p.goto(B + '/events', { waitUntil: 'networkidle' });
          await p.waitForTimeout(600);
          await p.screenshot({ path: OUT + `${vname}-${theme}-error-events.png`, fullPage: true });
          await p.unroute('**/api/events**');
        }
        await ctx.close();
      }
    }
  }
  await browser.close();
  return log.join('\n');
}
