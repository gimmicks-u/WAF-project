import axios from 'axios';
import type { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

// Axios instance with base URL and token injection
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001',
  withCredentials: false,
});

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('waf-auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist stores state under .state
    return parsed?.state?.token ?? parsed?.token ?? null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    const headers: AxiosRequestHeaders = (config.headers ?? {}) as AxiosRequestHeaders;
    headers['Authorization'] = `Bearer ${token}`;
    config.headers = headers;
  }
  return config;
});

export default api;
