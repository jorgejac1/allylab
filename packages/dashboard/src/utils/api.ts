import { API } from '../config';

export function getApiBase(): string {
  if (typeof window === 'undefined') return API.DEFAULT_BASE_URL;
  return localStorage.getItem(API.STORAGE_KEY) || API.DEFAULT_BASE_URL;
}