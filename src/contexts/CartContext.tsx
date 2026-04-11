// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { showSuccess, showError, showInfo, showLoading, dismissToast } from '../utils/toast';

// Extended CartItem with color support
export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  uniqueId: string; // Unique identifier combining product ID and color
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; color?: string } }
  | { type: 'REMOVE_ITEM'; payload: { uniqueId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { uniqueId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Helper to generate unique ID based on product ID and color
const generateUniqueId = (productId: number, color?: string): string => {
  return color ? `${productId}-${color.toLowerCase()}` : `${productId}`;
};

const CartContext = createContext<{
  state: CartState;
  addItem: (product: Product, color?: string) => void;
  removeItem: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
} | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, color } = action.payload;
      const uniqueId = generateUniqueId(product.id, color);
      
      const existingItem = state.items.find(item => item.uniqueId === uniqueId);
      
      if (existingItem) {
        // Update quantity if item exists
        return {
          ...state,
          items: state.items.map(item =>
            item.uniqueId === uniqueId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          total: state.total + product.price
        };
      }
      
      // Add new item with color
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedColor: color,
        uniqueId
      };
      
      return {
        items: [...state.items, newItem],
        total: state.total + product.price
      };
    }
    
    case 'REMOVE_ITEM': {
      const item = state.items.find(item => item.uniqueId === action.payload.uniqueId);
      return {
        items: state.items.filter(item => item.uniqueId !== action.payload.uniqueId),
        total: state.total - (item ? item.price * item.quantity : 0)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const item = state.items.find(item => item.uniqueId === action.payload.uniqueId);
      if (!item) return state;
      const quantityDiff = action.payload.quantity - item.quantity;
      return {
        items: state.items.map(item =>
          item.uniqueId === action.payload.uniqueId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        total: state.total + (item.price * quantityDiff)
      };
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0 };

    case 'LOAD_CART':
      return { 
        items: action.payload, 
        total: action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
      };
      
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const { user } = useAuth();

  // Get the cart storage key for the current user
  const getCartStorageKey = () => {
    if (user && user.id) {
      return `cart_${user.id}`;
    }
    return 'cart_guest';
  };

  // Load cart when user changes (login, logout, or switch accounts)
  useEffect(() => {
    const loadCart = () => {
      const storageKey = getCartStorageKey();
      const savedCart = localStorage.getItem(storageKey);
      
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          // Handle both old format (just items array) and new format ({ items: [] })
          let items = Array.isArray(parsedCart) ? parsedCart : parsedCart.items;
          
          if (Array.isArray(items) && items.length > 0) {
            // Validate that items have required fields
            const validItems = items.filter(item => item.id && item.quantity);
            if (validItems.length > 0) {
              dispatch({ type: 'LOAD_CART', payload: validItems });
            } else {
              dispatch({ type: 'CLEAR_CART' });
            }
          } else {
            dispatch({ type: 'CLEAR_CART' });
          }
        } catch (error) {
          console.error('Failed to load cart from localStorage:', error);
          dispatch({ type: 'CLEAR_CART' });
        }
      } else {
        // No saved cart for this user
        dispatch({ type: 'CLEAR_CART' });
      }
    };

    loadCart();
  }, [user?.id]); // Re-run when user ID changes

  // Save cart whenever it changes
  useEffect(() => {
    const saveCart = () => {
      const storageKey = getCartStorageKey();
      
      if (state.items.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(state.items));
      } else {
        // If cart is empty, remove from localStorage to keep it clean
        localStorage.removeItem(storageKey);
      }
    };

    saveCart();
  }, [state.items, user?.id]);

  const addItem = (product: Product, color?: string) => {
    // Check if item already exists
    const uniqueId = generateUniqueId(product.id, color);
    const existingItem = state.items.find(item => item.uniqueId === uniqueId);
    
    if (existingItem) {
      // Item exists, show quantity increased message
      dispatch({ type: 'ADD_ITEM', payload: { product, color } });
      showSuccess(`${product.name} quantity increased!`);
    } else {
      // New item, show added to cart message
      dispatch({ type: 'ADD_ITEM', payload: { product, color } });
      showSuccess(`${product.name} added to cart! 🛒`);
    }
  };

  const removeItem = (uniqueId: string) => {
    // Find the item before removing to get its name
    const item = state.items.find(item => item.uniqueId === uniqueId);
    dispatch({ type: 'REMOVE_ITEM', payload: { uniqueId } });
    if (item) {
      showInfo(`${item.name} removed from cart`);
    }
  };

  const updateQuantity = (uniqueId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(uniqueId);
      return;
    }
    
    // Find the item to get its name
    const item = state.items.find(item => item.uniqueId === uniqueId);
    dispatch({ type: 'UPDATE_QUANTITY', payload: { uniqueId, quantity } });
    
    if (item) {
      showSuccess(`${item.name} quantity updated to ${quantity}`);
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    showInfo('Cart cleared');
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};