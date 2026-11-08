import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SiteSettings } from '../../../../core';
import { AdminToast } from '../../utils/admin-toast';
import { AdminSettings } from './admin-settings';

describe('AdminSettings', () => {
  let http: HttpTestingController;
  let settings: SiteSettings;
  const toast = { show: vi.fn() };

  beforeEach(() => {
    toast.show.mockClear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AdminToast, useValue: toast }],
    });
    http = TestBed.inject(HttpTestingController);
    settings = TestBed.inject(SiteSettings);
    http.expectOne('/api/settings').flush({ timeZone: 'Europe/Warsaw' });
  });

  afterEach(() => http.verify());

  function render() {
    const fixture = TestBed.createComponent(AdminSettings);
    fixture.detectChanges();
    http.expectOne('/api/features').flush({});
    http.expectOne('/api/admin/features').flush([]);
    http.expectOne('/version.json').flush({ commit: '' });
    http.expectOne('/api/version').flush({ commit: '', deployedAt: null });
    const element: HTMLElement = fixture.nativeElement;
    const select = element.querySelector('select')!;
    const button = element.querySelector<HTMLButtonElement>('.row button')!;
    return { fixture, element, select, button };
  }

  function choose(select: HTMLSelectElement, zone: string) {
    select.value = zone;
    select.dispatchEvent(new Event('change'));
  }

  it('saves the chosen zone, applies it app-wide and confirms with a toast', () => {
    const { fixture, element, select, button } = render();
    expect(select.value).toBe('Europe/Warsaw');
    expect(button.disabled).toBe(true);

    choose(select, 'Europe/London');
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    expect(element.querySelector('.preview')?.textContent).toMatch(/^Now: \w{3} \d{1,2} \w{3}, \d{2}:\d{2}$/);
    button.click();

    const request = http.expectOne('/api/admin/settings');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ timeZone: 'Europe/London' });
    request.flush({ timeZone: 'Europe/London' });
    fixture.detectChanges();

    expect(settings.timeZone()).toBe('Europe/London');
    expect(toast.show).toHaveBeenCalledWith('Time zone saved');
    expect(button.disabled).toBe(true);
  });

  it('shows an inline error when the server rejects the zone', () => {
    const { fixture, element, select, button } = render();
    choose(select, 'Europe/London');
    fixture.detectChanges();
    button.click();
    http.expectOne('/api/admin/settings').flush(null, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(settings.timeZone()).toBe('Europe/Warsaw');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('isn’t supported');
    expect(toast.show).not.toHaveBeenCalled();
  });
});
