import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { setAccessToken as setApiAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      // Access token will be set by the first API call that triggers refresh
    } else {
      setLoading(false);
    }

    // Listen for token refresh events from api.js
    const handleTokenRefreshed = (event) => {
      setApiAccessToken(event.detail); // Update in api.js module
    };

    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('authLogout', handleAuthLogout);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('authLogout', handleAuthLogout);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setApiAccessToken(accessToken); // Set in api.js module
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const signup = async (name, email, password, role = 'member') => {
    try {
      const response = await api.post('/auth/signup', { name, email, password, role });
      const { user, accessToken } = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setApiAccessToken(accessToken); // Set in api.js module
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setApiAccessToken(null); // Clear in api.js module
      setUser(null);
    }
  };

  const isAdmin = () => user?.role === 'admin';

  const value = {
    user,
    login,
    signup,
    logout,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
