import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For physical devices or Android emulators, this might need to change
// (e.g., 10.0.2.2 for Android emulator, or your local network IP).
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  async (config) => {
    let token = null;

    // SecureStore is not supported on web
    if (Platform.OS === 'web') {
      token = localStorage.getItem('token');
    } else {
      token = await SecureStore.getItemAsync('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
