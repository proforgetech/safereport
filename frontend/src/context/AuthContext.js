import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to save token
  const saveToken = async (token) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('token', token);
    } else {
      await SecureStore.setItemAsync('token', token);
    }
  };

  // Helper to remove token
  const removeToken = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('token');
    } else {
      await SecureStore.deleteItemAsync('token');
    }
  };

  // Load user on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const response = await client.get('/users/me');
        setUser(response.data);
      } catch (e) {
        // Token might be invalid or not present
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    try {
      // Need x-www-form-urlencoded for OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await client.post('/auth/login', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const { access_token } = response.data;
      await saveToken(access_token);
      
      // Fetch user profile
      const userResponse = await client.get('/users/me');
      setUser(userResponse.data);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      await client.post('/auth/register', { email, password });
      // After successful registration, log them in
      return await login(email, password);
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
