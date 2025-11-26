const DEFAULT_API_URL = 'http://localhost:3001';
const STORAGE_KEY = 'allylab_api_url';

export function getApiBase(): string {
  if (typeof window === 'undefined') return DEFAULT_API_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_API_URL;
}