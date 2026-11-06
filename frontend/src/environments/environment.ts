// Production build: the app is served by Nginx, which proxies /api to the backend,
// so API calls stay same-origin.
export const environment = {
  production: true,
  apiBaseUrl: '',
  features: {
    // shortcut: temporary feature flag for #33; remove the flag (keep the behaviour) once the team confirms it.
    pastEventTag: true,
  },
};
