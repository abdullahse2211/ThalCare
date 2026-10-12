/**
 * ThalCare API Wrapper
 * Handles all HTTP requests with authentication, token refresh, and error handling
 */

import axios from 'axios';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;
const JWT_STORAGE_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'thalcare_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'thalcare_refresh_token';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token management utilities
export const TokenService = {
  getAccessToken: () => localStorage.getItem(JWT_STORAGE_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(JWT_STORAGE_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens: () => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user');
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};

// Request queue for handling concurrent requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = TokenService.getAccessToken();

    if (token && !config.headers['Skip-Auth']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove skip auth header before sending
    delete config.headers['Skip-Auth'];

    // Log request in development
    if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenService.getRefreshToken();

      // If no refresh token, or it's a fake/mock token, clear everything
      const isFakeRefreshToken = !refreshToken || refreshToken.split('.').length !== 3;
      if (isFakeRefreshToken) {
        TokenService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;

        if (!access_token) {
          // Refresh endpoint didn't return a valid token — clear and redirect
          throw new Error('Refresh failed');
        }

        TokenService.setTokens(access_token, newRefreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        processQueue(null, access_token);

        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        TokenService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors — FastAPI uses 'detail', not 'message'
    const errorResponse = {
      status: error.response?.status,
      message: error.response?.data?.detail || error.response?.data?.message || error.message || 'An error occurred',
      errors: error.response?.data?.errors || [],
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
    };

    if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
      console.error('[API Error]', errorResponse);
    }

    return Promise.reject(errorResponse);
  }
);

// API methods with proper typing
export const apiClient = {
  // GET request
  get: async (url, config = {}) => {
    const response = await api.get(url, config);
    return response.data;
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    const response = await api.patch(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
  },

  // Upload file with progress tracking
  upload: async (url, formData, onProgress = null) => {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Download file
  download: async (url, filename) => {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export default api;
