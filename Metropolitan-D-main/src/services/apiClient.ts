import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, RefreshTokenResponse } from '../types/api';

/**
 * Centralized Axios API Client with automatic token refresh.
 *
 * Features:
 * - Automatic access token injection in request headers
 * - Automatic token refresh on 401 errors
 * - Request/response interceptors for centralized error handling
 * - Supports HttpOnly cookie-based refresh tokens
 */

//const BASE_URL = 'http://localhost:8080/api';
const BASE_URL = 'https://metropolitan-b-production.up.railway.app/api';

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

/**
 * Create Axios instance with base configuration.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Enable sending cookies (for HttpOnly refresh token)
  timeout: 30000, // 30 seconds
});

/**
 * Request Interceptor:
 * - Adds access token to Authorization header
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * - Handles automatic token refresh on 401 errors (ADMIN only)
 * - EMPLOYEE users are redirected to login immediately on 401
 * - Retries failed requests after token refresh
 * - Preserves error response data for proper error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    // Successful response, return as is
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log errors in development for debugging
    if (import.meta.env.DEV && error.response) {
      console.group(`🔴 API Error: ${error.response.status} ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
      console.groupEnd();
    }

    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent refresh endpoint from triggering infinite loop
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.error('❌ Refresh token failed or expired, redirecting to login...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Check user role - only ADMIN users can refresh tokens
      const userData = localStorage.getItem('userData');
      let userRole: string | null = null;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userRole = user.role;
        } catch (e) {
          console.error('Failed to parse userData:', e);
        }
      }

      // EMPLOYEE users must re-authenticate - no token refresh
      if (userRole === 'EMPLOYEE') {
        console.log('🔒 EMPLOYEE user 401 - redirecting to login (no refresh token)');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Only ADMIN users proceed with token refresh
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Retry the original request with new token
            const token = localStorage.getItem('accessToken');
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token (ADMIN only)
        // The refresh token is automatically sent via HttpOnly cookie
        const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
          `${BASE_URL}/auth/refresh`,
          {}, // Empty body, refresh token comes from cookie
          {
            withCredentials: true, // Send cookies
          }
        );

        if (response.data.status && response.data.data) {
          const { accessToken } = response.data.data;

          // Store new access token
          localStorage.setItem('accessToken', accessToken);

          // Update default header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Process queued requests
          processQueue();
          isRefreshing = false;

          if (import.meta.env.DEV) {
            console.log('✅ Token refreshed successfully for ADMIN user');
          }

          // Retry the original request
          return apiClient(originalRequest);
        } else {
          throw new Error('Token refresh failed: Invalid response');
        }
      } catch (refreshError) {
        // Refresh failed, clear auth data and redirect to login
        console.error('❌ Token refresh failed:', refreshError);
        processQueue(refreshError as Error);
        isRefreshing = false;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // For all other errors, preserve the error response and reject
    // This ensures components can access error.response.data.message
    return Promise.reject(error);
  }
);

export default apiClient;
