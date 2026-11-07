import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminApi } from '../../data-access/admin-api';
import { AdminEventForm } from './admin-event-form';

describe('AdminEventForm', () => {
  const loaded = { id: 'e1', status: 1, title: 'Welcome Party', shortDescription: 'Short', description: 'Long', location: 'Gdańsk', startsAt: '2026-11-10T18:00:00Z', endsAt: null, price: 0, registrationUrl: null, googleMapsUrl: null, minimumParticipants: null, maximumParticipants: null, imagePath: null };
  let api: { getEvent: ReturnType<typeof vi.fn> };

  function render(params: Record<string, string>) {
    api = { getEvent: vi.fn(() => of(loaded as never)) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminApi, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    const fixture = TestBed.createComponent(AdminEventForm);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, component: fixture.componentInstance, element };
  }

  it('renders an empty create form when there is no eventId param', () => {
    const { component, element } = render({});

    expect(component.isEdit).toBe(false);
    expect(api.getEvent).not.toHaveBeenCalled();
    expect(element.querySelector('h1')?.textContent).toContain('Create event');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Create event');
    expect(component.hasChanges()).toBe(true);
  });

  it('loads the event and only allows saving after a change in edit mode', () => {
    const { fixture, component, element } = render({ eventId: 'e1' });

    expect(api.getEvent).toHaveBeenCalledWith('e1');
    expect(element.querySelector('h1')?.textContent).toContain('Edit event');
    expect(component.form.controls.title.value).toBe(loaded.title);
    expect(component.hasChanges()).toBe(false);

    component.form.controls.title.setValue('Changed');
    fixture.detectChanges();
    expect(component.hasChanges()).toBe(true);
  });
});
