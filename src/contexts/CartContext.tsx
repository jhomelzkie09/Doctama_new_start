import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product } from '../types';

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
  | { type: 'CLEAR_CART' };

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
      
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const { items } = JSON.parse(savedCart);
        if (Array.isArray(items)) {
          items.forEach((item: CartItem) => {
            // Re-add each item with its color
            const product: Product = {
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              categoryId: item.categoryId,
              stockQuantity: item.stockQuantity,
              isActive: item.isActive,
              createdAt: item.createdAt,
              height: item.height,
              width: item.width,
              length: item.length,
              colorsVariant: item.colorsVariant,
            };
            
            // Add the item with the stored quantity
            for (let i = 0; i < item.quantity; i++) {
              dispatch({ type: 'ADD_ITEM', payload: { product, color: item.selectedColor } });
            }
          });
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const addItem = (product: Product, color?: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, color } });
  };

  const removeItem = (uniqueId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { uniqueId } });
  };

  const updateQuantity = (uniqueId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(uniqueId);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { uniqueId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
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