declare global {
  interface Window {
    _env_?: { REACT_APP_API_URL?: string };
  }
}

const inferDevApiUrl = (): string => {
  // CRA proxy (package.json "proxy") forwards unknown requests to the
  // backend at http://localhost:8001 inside the container.  By returning
  // an empty string we use relative URLs ("/auth/me", "/api/...") which
  // the dev-server proxies automatically — no extra port-forwarding or
  // CORS configuration is required.
  return '';
};

const isDev = process.env.NODE_ENV === 'development';

// In local development, always use relative URLs so CRA's dev proxy handles
// backend routing and we avoid browser-side localhost:8001 connectivity issues.
export const API_URL = isDev
  ? ''
  : (window._env_?.REACT_APP_API_URL ||
    process.env.REACT_APP_API_URL ||
    inferDevApiUrl());
