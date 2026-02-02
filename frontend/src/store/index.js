import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        localStorage.setItem('token', token);
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
      },
      
      updateUser: (userData) => {
        set({ user: userData });
      },
      
      setUser: (user) => {
        set({ user });
      },
      
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingIndex = items.findIndex(item => item.productId === product._id);
        
        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({
            items: [...items, {
              productId: product._id,
              name: product.name,
              unit: product.unit,
              pricePerUnit: product.pricePerUnit,
              stock: product.stock,
              category: product.category,
              images: product.images || [],
              quantity,
            }]
          });
        }
      },
      
      updateQuantity: (productId, quantity) => {
        const items = get().items.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        );
        set({ items });
      },
      
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.productId !== productId) });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
