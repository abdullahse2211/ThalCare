/**
 * ThalCare Authentication Context
 * Manages user authentication state across the application
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, TokenService } from '../api';

// Check if mock mode is enabled
const IS_MOCK_MODE = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// User roles enum
export const UserRoles = {
  DOCTOR: 'doctor',
  LAB_TECHNICIAN: 'lab_technician',
  ADMIN: 'admin',
};

// Mock users for development
const MOCK_USERS = {
  'doctor@thalcare.com': {
    id: 1,
    email: 'doctor@thalcare.com',
    name: 'Dr. Ahmed Khan',
    role: 'doctor',
    avatar: null,
    phone: '0300-1234567',
    department: 'Hematology',
    permissions: ['view_patients', 'add_patients', 'view_predictions', 'run_predictions', 'view_analytics'],
    created_at: '2024-01-15T10:00:00Z',
  },
  'lab@thalcare.com': {
    id: 2,
    email: 'lab@thalcare.com',
    name: 'Ali Hassan',
    role: 'lab_technician',
    avatar: null,
    phone: '0301-2345678',
    department: 'Laboratory',
    permissions: ['view_patients', 'add_patients', 'enter_tests', 'upload_reports'],
    created_at: '2024-02-01T10:00:00Z',
  },
  'admin@thalcare.com': {
    id: 3,
    email: 'admin@thalcare.com',
    name: 'Sara Malik',
    role: 'admin',
    avatar: null,
    phone: '0302-3456789',
    department: 'Administration',
    permissions: ['manage_users', 'view_logs', 'system_settings', 'view_analytics'],
    created_at: '2024-01-01T10:00:00Z',
  },
};

const MOCK_PASSWORD = 'password123';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Initialize auth state from stored token/user
  useEffect(() => {
    const initializeAuth = async () => {
      if (IS_MOCK_MODE) {
        // In mock mode, just check localStorage for user
        const storedUser = localStorage.getItem(
          import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user'
        );
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user');
          }
        }
        setIsLoading(false);
        return;
      }

      // Real API mode — first check if stored token is a real JWT
      const token = TokenService.getAccessToken();

      // Detect and purge mock/fake tokens (a real JWT always has exactly 3 dot-separated parts)
      const isFakeToken = token && token.split('.').length !== 3;
      if (isFakeToken) {
        // Clear all stale mock session data and force fresh login
        TokenService.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      if (token && !TokenService.isTokenExpired(token)) {
        try {
          // Verify token and get fresh user data from backend
          const userData = await authAPI.getProfile();
          // Normalize role to lowercase for frontend consistency
          if (userData && userData.role) {
            userData.role = userData.role.toLowerCase();
          }

          // Build full name if not provided
          if (userData && !userData.name) {
            userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
          }
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          // Token invalid, clear everything and redirect to login
          TokenService.clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No valid token → clear stale data and force login
        TokenService.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      // MOCK MODE: Use mock users
      if (IS_MOCK_MODE) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockUser = MOCK_USERS[email.toLowerCase()];

        if (!mockUser) {
          throw new Error('Invalid email address. Use demo credentials.');
        }

        if (password !== MOCK_PASSWORD) {
          throw new Error('Invalid password. Use: password123');
        }

        // Store mock user
        localStorage.setItem(
          import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user',
          JSON.stringify(mockUser)
        );

        // Set mock tokens (for consistency)
        TokenService.setTokens('mock_access_token_' + mockUser.id, 'mock_refresh_token_' + mockUser.id);

        setUser(mockUser);
        setIsAuthenticated(true);
        setIsLoading(false);

        return { success: true, user: mockUser };
      }

      // REAL API MODE
      const response = await authAPI.login({ email, password });
      const { access_token, refresh_token, user: userData } = response;

      if (!access_token) {
        throw new Error('Login failed — no token received from server.');
      }

      // Store tokens
      TokenService.setTokens(access_token, refresh_token);

      // Build full name if not provided
      const fullUser = {
        ...userData,
        name: userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      };

      // Store user data
      localStorage.setItem(
        import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user',
        JSON.stringify(fullUser)
      );

      setUser(fullUser);
      setIsAuthenticated(true);

      return { success: true, user: fullUser };
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    } finally {
      if (!IS_MOCK_MODE) {
        setIsLoading(false);
      }
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (!IS_MOCK_MODE) {
        await authAPI.logout();
      }
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      TokenService.clearTokens();
      localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (data) => {
    try {
      if (IS_MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem(
          import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user',
          JSON.stringify(updatedUser)
        );
        return { success: true, user: updatedUser };
      }

      // Convert combined 'name' field to first_name and last_name for the backend
      let apiPayload = { ...data };
      if (apiPayload.name) {
        const parts = apiPayload.name.split(' ');
        apiPayload.first_name = parts[0] || '';
        apiPayload.last_name = parts.slice(1).join(' ') || '';
        delete apiPayload.name; // Backend doesn't expect 'name'
      }

      const updatedUser = await authAPI.updateProfile(apiPayload);

      // Normalize role and name
      if (updatedUser.role) {
        updatedUser.role = updatedUser.role.toLowerCase();
      }
      if (!updatedUser.name) {
        updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim();
      }

      setUser(updatedUser);
      localStorage.setItem(
        import.meta.env.VITE_USER_STORAGE_KEY || 'thalcare_user',
        JSON.stringify(updatedUser)
      );
      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      if (IS_MOCK_MODE) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        if (currentPassword !== MOCK_PASSWORD) {
          throw new Error('Current password is incorrect');
        }
        return { success: true };
      }

      await authAPI.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    hasPermission,
    clearError: () => setError(null),
    isMockMode: IS_MOCK_MODE,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
