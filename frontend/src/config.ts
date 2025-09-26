// frontend/src/config.ts
const ENV_API = import.meta.env.VITE_API_URL as string | undefined;

// If VITE_API_URL is provided, use it.
// Otherwise: on production use the proxy path '/api', on dev use localhost.
export const API_BASE =
  (ENV_API && ENV_API.length)
    ? ENV_API
    : (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5000/api');

export const BASE_URL =
  (import.meta.env.VITE_BASE_URL as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
