import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminApi } from './admin-api';

describe('AdminApi image form data', () => {
  let api: AdminApi;
  let http: HttpTestingController;
  const news = { title: 'T', description: 'D' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AdminApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates news without an image file', () => {
    api.createNews(news, null).subscribe();
    const body = http.expectOne((req) => req.url.endsWith('/news')).request.body as FormData;
    expect(body.has('image')).toBe(false);
    expect(body.get('title')).toBe('T');
  });

  it('sends removeImage on news and info updates', () => {
    api.updateNews('1', news, null, true).subscribe();
    const newsBody = http.expectOne((req) => req.url.endsWith('/news/1')).request.body as FormData;
    expect(newsBody.get('removeImage')).toBe('true');

    const file = new File(['x'], 'a.png', { type: 'image/png' });
    api.updateInfo('2', { title: 'T', slug: 't', content: 'C', category: 'c', externalLinks: [] }, file, false).subscribe();
    const infoBody = http.expectOne((req) => req.url.endsWith('/info/2')).request.body as FormData;
    expect(infoBody.get('removeImage')).toBe('false');
    expect(infoBody.get('image')).toBeInstanceOf(File);
  });
});
