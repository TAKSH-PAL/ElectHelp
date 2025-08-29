import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      
      setAuth: (user, token) => {
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        set({ user, token });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await axios.post('/auth/login', { email, password });
          const { user, token } = response.data.data;
          get().setAuth(user, token);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            message: error.response?.data?.message || 'Login failed' 
          };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await axios.post('/auth/register', userData);
          const { user, token } = response.data.data;
          get().setAuth(user, token);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            message: error.response?.data?.message || 'Registration failed' 
          };
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null });
      },

      // Initialize axios headers on app load
      initialize: () => {
        const { token } = get();
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);

// Initialize on store creation
useAuthStore.getState().initialize();
