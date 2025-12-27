import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthTokenResponse } from '../types/api';
import apiClient from '../services/apiClient';

/**
 * Auth Context for managing authentication state globally.
 *
 * Features:
 * - Centralized authentication state
 * - Access token management
 * - User profile storage
 * - Automatic session restoration on page reload
 * - Integrated logout with server-side token revocation
 */

interface UserData {
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  contactNumber: string;
}

interface AuthContextType {
  user: UserData | null;
  login: (authResponse: AuthTokenResponse) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);

  // Restore session on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');

    if (accessToken && userData) {
      try {
        const parsedUser: UserData = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse user data from localStorage', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  /**
   * Logs in the user and stores auth data.
   *
   * @param authResponse The authentication response from the backend
   */
  const login = (authResponse: AuthTokenResponse) => {
    // Extract user data
    const userData: UserData = {
      email: authResponse.email,
      name: authResponse.name,
      role: authResponse.role,
      contactNumber: authResponse.contactNumber,
    };

    // Store access token
    localStorage.setItem('accessToken', authResponse.accessToken);

    // Store user data
    localStorage.setItem('userData', JSON.stringify(userData));

    // Update state
    setUser(userData);
  };

  /**
   * Updates the access token in storage.
   * Used after token refresh.
   *
   * @param token New access token
   */
  const updateAccessToken = (token: string) => {
    localStorage.setItem('accessToken', token);
  };

  /**
   * Logs out the user.
   * - Calls backend logout endpoint to revoke refresh token
   * - Clears local storage
   * - Redirects to login page
   */
  const logout = async () => {
    try {
      // Call backend logout endpoint to revoke refresh token
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');

      // Update state
      setUser(null);

      // Redirect to login
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    updateAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};