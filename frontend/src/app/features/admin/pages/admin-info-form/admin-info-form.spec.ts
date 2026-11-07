import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminApi } from '../../data-access/admin-api';
import { AdminInfoForm } from './admin-info-form';

describe('AdminInfoForm', () => {
  const loaded = { id: 'i1', status: 1, title: 'Housing', slug: 'housing', category: 'Living', content: 'Content', externalLinks: [], imagePath: null };
  let api: { getInfoArticle: ReturnType<typeof vi.fn> };

  function render(params: Record<string, string>) {
    api = { getInfoArticle: vi.fn(() => of(loaded as never)) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminApi, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    const fixture = TestBed.createComponent(AdminInfoForm);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, component: fixture.componentInstance, element };
  }

  it('renders an empty create form when there is no infoId param', () => {
    const { component, element } = render({});

    expect(component.isEdit).toBe(false);
    expect(api.getInfoArticle).not.toHaveBeenCalled();
    expect(element.querySelector('h1')?.textContent).toContain('Create info article');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Create article');
    expect(component.hasChanges()).toBe(true);
  });

  it('loads the article and only allows saving after a change in edit mode', () => {
    const { fixture, component, element } = render({ infoId: 'i1' });

    expect(api.getInfoArticle).toHaveBeenCalledWith('i1');
    expect(element.querySelector('h1')?.textContent).toContain('Edit info article');
    expect(component.form.controls.title.value).toBe(loaded.title);
    expect(component.hasChanges()).toBe(false);

    component.form.controls.title.setValue('Changed');
    fixture.detectChanges();
    expect(component.hasChanges()).toBe(true);
  });
});
