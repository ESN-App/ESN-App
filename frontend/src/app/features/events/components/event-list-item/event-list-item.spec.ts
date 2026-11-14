import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { FeatureFlags } from '../../../../core';
import { EventListItem, EventListItemView } from './event-list-item';

const jwt = (role: string) => {
  const enc = (v: object) => btoa(JSON.stringify(v)).replace(/\+/g, '-').replace(/\//g, '_');
  return `${enc({ alg: 'none' })}.${enc({ role, exp: Math.floor(Date.now() / 1000) + 3600 })}.s`;
};

function render(
  status: number,
  flag = true,
  admin = false,
  over: Partial<EventListItemView> = {},
): HTMLElement {
  TestBed.resetTestingModule();
  localStorage.clear();
  if (admin) localStorage.setItem('esn-app.token', jwt('Admin'));
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  TestBed.inject(FeatureFlags).pastEventTag.set(flag);
  const fixture = TestBed.createComponent(EventListItem);
  const event: EventListItemView = {
    id: '1',
    title: 'Past',
    shortDescription: '',
    location: '',
    imagePath: null,
    startsAt: '2020-01-01T10:00:00Z',
    endsAt: '2020-01-01T12:00:00Z',
    currentParticipants: null,
    maximumParticipants: null,
    price: 0,
    status,
    ...over,
  };
  fixture.componentRef.setInput('event', event);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('article');
}

describe('EventListItem ended state', () => {
  it('marks an ended event', () => {
    expect(render(1).classList).toContain('event-card--ended');
  });

  it('does not mark a cancelled event', () => {
    expect(render(2).classList).not.toContain('event-card--ended');
  });

  it('does not mark when the past-events flag is off', () => {
    expect(render(1, false).classList).not.toContain('event-card--ended');
  });

  describe('chips', () => {
    const paid = { price: 10, currentParticipants: 3, maximumParticipants: 3 };
    const chips = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('.chip')).map((c) => c.textContent!.trim());

    it('shows only the ended chip to students', () => {
      const el = render(1, true, false, paid);
      expect(chips(el)).toEqual(['checkThis event has ended']);
      expect(el.querySelector('.sticker')).toBeNull();
      expect(render(1).querySelector('.sticker')).toBeNull();
    });

    it('keeps all chips for admins', () => {
      const text = chips(render(1, true, true, paid)).join('|');
      expect(text).toContain('Full');
      expect(text).toContain('10 zł');
      expect(render(1, true, true).querySelector('.sticker')).not.toBeNull();
    });

    it('is unchanged when not ended', () => {
      const future = { ...paid, startsAt: '2999-01-01T10:00:00Z', endsAt: '2999-01-01T12:00:00Z' };
      expect(chips(render(1, true, false, future)).join('|')).toContain('10 zł');
    });

    it('is unchanged for cancelled events', () => {
      expect(chips(render(2, true, false, paid)).join('|')).toContain('Cancelled');
    });
  });
});
