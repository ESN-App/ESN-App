export const environment = {
  production: false,
  // Keep API calls on the frontend origin. The Angular development server
  // proxies /api to the backend, which also works for devices on the LAN.
  apiBaseUrl: '',
  features: {
    // shortcut: temporary feature flag for #33; remove the flag (keep the behaviour) once the team confirms it.
    pastEventTag: true,
  },
};
