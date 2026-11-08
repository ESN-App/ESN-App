import { describe, expect, it } from 'vitest';
import { detailDirection, heroRules } from './detail-transition';

describe('heroRules', () => {
  it('names the details target and the source in the card linking to the details path', () => {
    document.body.innerHTML = `
      <article class="card"><div data-hero-source id="hit"></div><a href="/events/party-1?month=2026-09">Party</a></article>
      <article class="card"><div data-hero-source id="other"></div><a href="/events/party-10">Other</a></article>
      <a class="card" href="/news/7"><span data-hero-source id="news"></span></a>`;
    const selector = heroRules('events/party-1').replace(/\{[^}]*\}$/, '');
    expect([...document.querySelectorAll(selector)].map((element) => element.id)).toEqual(['hit']);
    const news = heroRules('news/7').replace(/\{[^}]*\}$/, '');
    expect([...document.querySelectorAll(news)].map((element) => element.id)).toEqual(['news']);
  });
});

describe('detailDirection', () => {
  it('goes forward from a list (or home) to a details page', () => {
    expect(detailDirection('events', 'events/party-1', false)).toBe('forward');
    expect(detailDirection('', 'news/42', false)).toBe('forward');
    expect(detailDirection('', 'events/party-1', false)).toBe('forward');
  });

  it('goes back from a details page to its list', () => {
    expect(detailDirection('partners/pueblo-7', 'partners', false)).toBe('back');
    expect(detailDirection('news/42', '', false)).toBe('back');
  });

  it('goes back on browser back to any non-details page', () => {
    expect(detailDirection('events/party-1', '', true)).toBe('back');
  });

  it('keeps the cross-fade for tab switches and details-to-details', () => {
    expect(detailDirection('events', 'partners', false)).toBeNull();
    expect(detailDirection('', 'events', false)).toBeNull();
    expect(detailDirection('events/party-1', 'partners', false)).toBeNull();
    expect(detailDirection('events/a', 'events/b', true)).toBeNull();
    expect(detailDirection('admin', 'admin/events/new', false)).toBeNull();
  });
});
