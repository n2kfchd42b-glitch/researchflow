declare global {
  interface Window {
    _env_?: { REACT_APP_API_URL?: string };
  }
}

const inferDevApiUrl = (): string => {
  return 'http://localhost:8001';
};

const isDev = process.env.NODE_ENV === 'development';

const getConfiguredApiUrl = (): string | undefined => {
  return window._env_?.REACT_APP_API_URL || process.env.REACT_APP_API_URL;
};

export const API_URL = isDev
  ? (getConfiguredApiUrl() || inferDevApiUrl())
  : (getConfiguredApiUrl() || inferDevApiUrl());
