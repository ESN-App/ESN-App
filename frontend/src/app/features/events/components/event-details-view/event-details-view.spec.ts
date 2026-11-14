import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { FeatureFlags } from '../../../../core';
import { EventDetailsView, type EventDetailsViewModel } from './event-details-view';

function render(startsAt: string, flag: boolean): HTMLElement {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  TestBed.inject(FeatureFlags).pastEventTag.set(flag);
  const fixture = TestBed.createComponent(EventDetailsView);
  const event: EventDetailsViewModel = {
    id: '1', title: 'T', shortDescription: '', location: '', imagePath: null, startsAt,
    endsAt: null, currentParticipants: null, maximumParticipants: null, price: 0, status: 1,
    description: '', googleMapsUrl: null, registrationUrl: 'https://x.test', minimumParticipants: null,
  };
  fixture.componentRef.setInput('event', event);
  fixture.detectChanges();
  return fixture.nativeElement;
}

describe('EventDetailsView ended grey modifier', () => {
  const has = (el: HTMLElement) => !!el.querySelector('.event-details--ended');

  it('is set for an ended event', () => {
    expect(has(render('2020-01-01T10:00:00Z', true))).toBe(true);
  });

  it('is absent for an upcoming event or with the flag off', () => {
    expect(has(render('2999-01-01T10:00:00Z', true))).toBe(false);
  });
});

describe('EventDetailsView add to calendar', () => {
  it('is shown for an upcoming event', () => {
    expect(render('2999-01-01T10:00:00Z', true).textContent).toContain('Add to calendar');
  });

  it('is hidden for a past event even with the past-event tag flag off', () => {
    expect(render('2020-01-01T10:00:00Z', false).textContent).not.toContain('Add to calendar');
  });
});
