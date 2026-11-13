import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.scss';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { registerSW } from 'virtual:pwa-register';
import { router } from './routes';

// Same as Angular's ngsw: the service worker only runs in production builds.
if (import.meta.env.PROD) {
  registerSW({ immediate: false });
}

const host = document.querySelector('app-root');
if (!host) {
  throw new Error('Missing <app-root> element in index.html');
}

createRoot(host).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
