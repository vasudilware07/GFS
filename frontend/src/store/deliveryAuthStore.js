import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deliveryAPI } from '../api';

export const useDeliveryAuthStore = create(
  persist(
    (set, get) => ({
      deliveryPerson: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await deliveryAPI.login({ email, password });
        const { deliveryPerson, token } = res.data.data;
        
        // Store token in localStorage for API interceptor
        localStorage.setItem('deliveryToken', token);
        
        set({
          deliveryPerson,
          token,
          isAuthenticated: true
        });
        
        return res.data;
      },

      logout: () => {
        localStorage.removeItem('deliveryToken');
        set({
          deliveryPerson: null,
          token: null,
          isAuthenticated: false
        });
      },

      updateProfile: (data) => {
        set((state) => ({
          deliveryPerson: { ...state.deliveryPerson, ...data }
        }));
      },

      refreshProfile: async () => {
        try {
          const res = await deliveryAPI.getMyProfile();
          set({ deliveryPerson: res.data.data });
        } catch (error) {
          // Only logout on explicit 401, not on network errors
          if (error.response?.status === 401) {
            console.log('Profile refresh 401 - checking token validity');
            // Don't auto logout - let user stay on page
          }
        }
      }
    }),
    {
      name: 'delivery-auth-storage',
      partialize: (state) => ({
        deliveryPerson: state.deliveryPerson,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      // Restore deliveryToken to localStorage when store rehydrates
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('deliveryToken', state.token);
        }
      }
    }
  )
);

export default useDeliveryAuthStore;
