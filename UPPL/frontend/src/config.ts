// frontend/src/config.ts
const ENV_API = import.meta.env.VITE_API_URL as string | undefined;

// Strip trailing slashes just in case
const sanitizedApi = ENV_API ? ENV_API.replace(/\/+$/, "") : undefined;

export const API_BASE =
  sanitizedApi && sanitizedApi.length
    ? sanitizedApi
    : (import.meta.env.MODE === "production"
        ? "/api"
        : "http://localhost:5000/api");

export const BASE_URL =
  (import.meta.env.VITE_BASE_URL as string) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");
