import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminApi } from '../../data-access/admin-api';
import { AdminNewsForm } from './admin-news-form';

describe('AdminNewsForm', () => {
  const loaded = { id: 'n1', status: 1, title: 'Hello', description: 'Description', imagePath: null, createdAt: '2026-11-01T10:00:00Z' };
  let api: { getNewsItem: ReturnType<typeof vi.fn> };

  function render(params: Record<string, string>) {
    api = { getNewsItem: vi.fn(() => of(loaded as never)) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminApi, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    const fixture = TestBed.createComponent(AdminNewsForm);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, component: fixture.componentInstance, element };
  }

  it('renders an empty create form when there is no newsId param', () => {
    const { component, element } = render({});

    expect(component.isEdit).toBe(false);
    expect(api.getNewsItem).not.toHaveBeenCalled();
    expect(element.querySelector('h1')?.textContent).toContain('Create news article');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Create news article');
    expect(component.hasChanges()).toBe(true);
  });

  it('loads the news article and only allows saving after a change in edit mode', () => {
    const { fixture, component, element } = render({ newsId: 'n1' });

    expect(api.getNewsItem).toHaveBeenCalledWith('n1');
    expect(element.querySelector('h1')?.textContent).toContain('Edit news article');
    expect(component.form.controls.title.value).toBe(loaded.title);
    expect(component.hasChanges()).toBe(false);

    component.form.controls.title.setValue('Changed');
    fixture.detectChanges();
    expect(component.hasChanges()).toBe(true);
  });
});
