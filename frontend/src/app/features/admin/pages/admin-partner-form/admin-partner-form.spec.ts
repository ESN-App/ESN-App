import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminApi } from '../../data-access/admin-api';
import { AdminPartnerForm } from './admin-partner-form';

describe('AdminPartnerForm', () => {
  const loaded = { id: 'p1', slug: 'cafe', status: 1, name: 'Cafe', shortDescription: 'Short', description: 'Long', address: null, websiteUrl: null, googleMapsUrl: null, latitude: null, longitude: null, logoPath: '/logo.png' };
  let api: { getPartnerBySlug: ReturnType<typeof vi.fn>; getPartnerDiscounts: ReturnType<typeof vi.fn> };

  function render(params: Record<string, string>) {
    api = { getPartnerBySlug: vi.fn(() => of(loaded as never)), getPartnerDiscounts: vi.fn(() => of([])) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminApi, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    const fixture = TestBed.createComponent(AdminPartnerForm);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, component: fixture.componentInstance, element };
  }

  it('renders an empty create form when there is no partnerSlug param', () => {
    const { component, element } = render({});

    expect(component.isEdit).toBe(false);
    expect(api.getPartnerBySlug).not.toHaveBeenCalled();
    expect(element.querySelector('h1')?.textContent).toContain('Create partner');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Create partner');
    expect(component.hasChanges()).toBe(true);
  });

  it('loads the partner and only allows saving after a change in edit mode', () => {
    const { fixture, component, element } = render({ partnerSlug: 'cafe' });

    expect(api.getPartnerBySlug).toHaveBeenCalledWith('cafe');
    expect(element.querySelector('h1')?.textContent).toContain('Edit partner');
    expect(component.form.controls.name.value).toBe(loaded.name);
    expect(component.hasChanges()).toBe(false);

    component.form.controls.name.setValue('Changed');
    fixture.detectChanges();
    expect(component.hasChanges()).toBe(true);
  });
});
