declare global {
  interface Window {
    _env_?: { REACT_APP_API_URL?: string };
  }
}

const inferDevApiUrl = (): string => {
  // Check if running in GitHub Codespaces
  if (process.env.REACT_APP_CODESPACE_NAME && process.env.REACT_APP_GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
    const codespace = process.env.REACT_APP_CODESPACE_NAME;
    const domain = process.env.REACT_APP_GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
    return `https://${codespace}-8001.${domain}`;
  }
  
  // Fallback to localhost for local development
  return 'http://localhost:8001';
};

const isDev = process.env.NODE_ENV === 'development';

const getConfiguredApiUrl = (): string | undefined => {
  return window._env_?.REACT_APP_API_URL || process.env.REACT_APP_API_URL;
};

// In development, use empty string so all API calls become relative paths
// and go through CRA's proxy (package.json "proxy": "http://localhost:8001").
// This avoids CORS issues entirely in Codespaces / local dev.
export const API_URL = isDev
  ? (getConfiguredApiUrl() || '')
  : (getConfiguredApiUrl() || inferDevApiUrl());
