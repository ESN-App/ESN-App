import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { FeatureFlags } from '../../../../core';
import { EventListItem, EventListItemView } from './event-list-item';

function render(status: number, flag = true): HTMLElement {
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
});
