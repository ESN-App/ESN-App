// Production build: the app is served by Nginx, which proxies /api to the backend,
// so API calls stay same-origin.
export const environment = {
  production: true,
  apiBaseUrl: '',
};
