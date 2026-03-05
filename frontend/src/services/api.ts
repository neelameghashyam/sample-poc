import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and provider header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const authProvider = localStorage.getItem('auth_provider');
    if (authProvider) {
      config.headers['X-Auth-Provider'] = authProvider;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Don't interfere during token exchange — let the callback handle the error
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/token')) {
        // Dynamic import avoids circular dependency (auth.ts imports api.ts)
        const { useAuthStore } = await import('@/stores/auth');
        const auth = useAuthStore();
        auth.setSessionExpired();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
