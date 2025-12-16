import axios from 'axios';
import { getAuthToken, removeAuthToken } from './auth';

// Backend runs on port 5000, but the API is at /api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add authentication token if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle response errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't redirect on login/register 401 errors (those are expected)
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        // Invalid or expired token for protected endpoints
        removeAuthToken();
        // Redirect to login if necessary
        if (typeof window !== 'undefined') {
          const locale = window.location.pathname.split('/')[1] || 'es';
          // Use window.location.href for a full page reload to clear state
          window.location.href = `/${locale}/login`;
        }
      } else {
        // For auth endpoints, log the error for debugging
        console.error('Authentication failed:', error.response?.data || error.message);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
