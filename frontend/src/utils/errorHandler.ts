import { AxiosError } from 'axios';
import type { ApiResponse } from '../types/api';

/**
 * Error Handler Utility
 *
 * Provides centralized error handling for Axios requests.
 * Extracts meaningful error messages from backend responses.
 */

export interface ErrorInfo {
  message: string;
  statusCode?: number;
  isNetworkError: boolean;
  isAuthError: boolean;
  isServerError: boolean;
  originalError?: unknown;
}

/**
 * Extracts a user-friendly error message from an Axios error.
 *
 * Priority:
 * 1. Backend ApiResponse message (response.data.message)
 * 2. HTTP status-specific messages
 * 3. Generic fallback
 *
 * @param error - The error object (typically AxiosError)
 * @param fallbackMessage - Optional custom fallback message
 * @returns ErrorInfo object with extracted error details
 */
export const extractErrorMessage = (
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred. Please try again.'
): ErrorInfo => {
  // Handle network errors (no response from server)
  if (error instanceof Error && error.message.includes('Network Error')) {
    return {
      message: 'Unable to connect to server. Please check your internet connection.',
      isNetworkError: true,
      isAuthError: false,
      isServerError: false,
      originalError: error,
    };
  }

  // Handle Axios errors
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const statusCode = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    // Try to extract backend error message
    let message = fallbackMessage;

    // Priority 1: Backend ApiResponse message
    if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      message = responseData.message || fallbackMessage;
    }
    // Priority 2: Generic error response with message
    else if (axiosError.response?.data && typeof axiosError.response.data === 'string') {
      message = axiosError.response.data;
    }
    // Priority 3: HTTP status-specific messages
    else if (statusCode) {
      message = getStatusCodeMessage(statusCode);
    }

    return {
      message,
      statusCode,
      isNetworkError: false,
      isAuthError: statusCode === 401 || statusCode === 403,
      isServerError: statusCode ? statusCode >= 500 : false,
      originalError: error,
    };
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      isNetworkError: false,
      isAuthError: false,
      isServerError: false,
      originalError: error,
    };
  }

  // Unknown error type
  return {
    message: fallbackMessage,
    isNetworkError: false,
    isAuthError: false,
    isServerError: false,
    originalError: error,
  };
};

/**
 * Type guard to check if error is an AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Returns user-friendly messages for common HTTP status codes
 */
function getStatusCodeMessage(statusCode: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Invalid credentials. Please check your email and password.',
    403: 'Access denied. You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This resource already exists or conflicts with existing data.',
    422: 'Validation error. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. The server is temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. The server took too long to respond.',
  };

  return statusMessages[statusCode] || `Request failed with status ${statusCode}.`;
}

/**
 * Logs error details to console in development mode
 */
export const logError = (error: ErrorInfo, context?: string) => {
  if (import.meta.env.DEV) {
    console.group(`❌ Error ${context ? `in ${context}` : ''}`);
    console.error('Message:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Is Network Error:', error.isNetworkError);
    console.error('Is Auth Error:', error.isAuthError);
    console.error('Is Server Error:', error.isServerError);
    console.error('Original Error:', error.originalError);
    console.groupEnd();
  }
};

/**
 * Example usage:
 *
 * try {
 *   const response = await apiService.login(credentials);
 * } catch (error) {
 *   const errorInfo = extractErrorMessage(error, 'Login failed');
 *   logError(errorInfo, 'Login');
 *   setError(errorInfo.message);
 * }
 */
