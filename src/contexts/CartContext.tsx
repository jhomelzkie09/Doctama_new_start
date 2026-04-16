// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { showSuccess, showInfo } from '../utils/toast';
import cartService from '../services/cart.service';

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
  const validColor = color && color.trim() !== '' ? color : undefined;
  return validColor ? `${productId}-${validColor.toLowerCase()}` : `${productId}`;
};

const CartContext = createContext<{
  state: CartState;
  addItem: (product: Product, color?: string) => void;
  removeItem: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  isSyncing: boolean;
} | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, color } = action.payload;
      const validColor = color && color.trim() !== '' ? color : undefined;
      const uniqueId = generateUniqueId(product.id, validColor);
      
      const existingItem = state.items.find(item => item.uniqueId === uniqueId);
      
      if (existingItem) {
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
      
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedColor: validColor,
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedWithBackend, setHasSyncedWithBackend] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getCartStorageKey = () => {
    if (user && user.id) {
      return `cart_${user.id}`;
    }
    return 'cart_guest';
  };

  // ✅ Load cart from backend when user logs in
  useEffect(() => {
    const loadCartFromBackend = async () => {
      if (!user?.id || hasSyncedWithBackend) return;
      
      setIsSyncing(true);
      console.log('📦 Loading cart from backend for user:', user.id);
      
      try {
        const backendCart = await cartService.getCart();
        
        if (backendCart && backendCart.items && backendCart.items.length > 0) {
          console.log('📦 Found backend cart with', backendCart.items.length, 'items');
          
          // Convert backend items to frontend CartItem format
          const backendItems: CartItem[] = backendCart.items.map(item => ({
            id: item.productId,
            name: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            imageUrl: item.imageUrl || '',
            selectedColor: item.selectedColor,
            uniqueId: generateUniqueId(item.productId, item.selectedColor),
            description: '',
            categoryId: 0,
            stockQuantity: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            height: 0,
            width: 0,
            length: 0,
            colorsVariant: []
          }));
          
          // Get local cart items
          const storageKey = getCartStorageKey();
          const savedCart = localStorage.getItem(storageKey);
          let localItems: CartItem[] = [];
          
          if (savedCart) {
            try {
              const parsed = JSON.parse(savedCart);
              localItems = Array.isArray(parsed) ? parsed : (parsed.items || []);
              console.log('📦 Found local cart with', localItems.length, 'items');
            } catch (e) {
              console.error('Failed to parse local cart:', e);
            }
          }
          
          // Merge: Backend takes priority, but keep local items not in backend
          const mergedItems = [...backendItems];
          
          for (const localItem of localItems) {
            const existsInBackend = backendItems.some(
              b => b.id === localItem.id && b.selectedColor === localItem.selectedColor
            );
            if (!existsInBackend) {
              mergedItems.push(localItem);
            }
          }
          
          if (mergedItems.length > 0) {
            dispatch({ type: 'LOAD_CART', payload: mergedItems });
            console.log('📦 Cart loaded from backend and merged with local. Total items:', mergedItems.length);
            
            // Save merged cart back to backend
            await cartService.saveCart(mergedItems);
          }
        } else {
          console.log('📦 No backend cart found, checking local cart...');
          
          // No backend cart, check if we have local cart to upload
          const storageKey = getCartStorageKey();
          const savedCart = localStorage.getItem(storageKey);
          
          if (savedCart) {
            try {
              const parsed = JSON.parse(savedCart);
              const localItems = Array.isArray(parsed) ? parsed : (parsed.items || []);
              
              if (localItems.length > 0) {
                console.log('📦 Uploading local cart to backend...');
                await cartService.saveCart(localItems);
                console.log('📦 Local cart uploaded to backend');
                dispatch({ type: 'LOAD_CART', payload: localItems });
              }
            } catch (e) {
              console.error('Failed to upload local cart:', e);
            }
          }
        }
        
        setHasSyncedWithBackend(true);
      } catch (error) {
        console.error('Failed to load cart from backend:', error);
        // Fallback to local cart
        loadLocalCart();
      } finally {
        setIsSyncing(false);
        setIsInitialized(true);
      }
    };

    loadCartFromBackend();
  }, [user?.id]);

  // ✅ Load local cart (fallback)
  const loadLocalCart = () => {
    const storageKey = getCartStorageKey();
    const savedCart = localStorage.getItem(storageKey);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        let items = Array.isArray(parsedCart) ? parsedCart : parsedCart.items;
        
        if (Array.isArray(items) && items.length > 0) {
          const validItems = items
            .filter((item: any) => item.id && item.quantity)
            .map((item: any) => ({
              ...item,
              selectedColor: item.selectedColor && item.selectedColor.trim() !== '' ? item.selectedColor : undefined
            }));
          
          if (validItems.length > 0) {
            dispatch({ type: 'LOAD_CART', payload: validItems });
          }
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
    setIsInitialized(true);
  };

  // ✅ Save cart to localStorage (backup)
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveCart = () => {
      const storageKey = getCartStorageKey();
      
      if (state.items.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(state.items));
      } else {
        localStorage.removeItem(storageKey);
      }
    };

    saveCart();
  }, [state.items, user?.id, isInitialized]);

  // ✅ Save cart to backend when items change (debounced)
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveCartToBackend = async () => {
      if (!user?.id || !hasSyncedWithBackend) return;
      
      try {
        await cartService.saveCart(state.items);
        console.log('📦 Cart auto-saved to backend');
      } catch (error) {
        console.error('Failed to save cart to backend:', error);
      }
    };

    const timeoutId = setTimeout(saveCartToBackend, 2000);
    return () => clearTimeout(timeoutId);
  }, [state.items, user?.id, hasSyncedWithBackend, isInitialized]);

  const addItem = (product: Product, color?: string) => {
    console.log('=== CART CONTEXT: addItem called ===');
    console.log('Product:', product.name);
    console.log('Color received:', color, 'Type:', typeof color);
    
    const validColor = color && color.trim() !== '' ? color : undefined;
    console.log('Valid color after trim:', validColor);
    
    const uniqueId = generateUniqueId(product.id, validColor);
    const existingItem = state.items.find(item => item.uniqueId === uniqueId);
    
    if (existingItem) {
      dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
      showSuccess(`${product.name} quantity increased!`);
    } else {
      dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
      showSuccess(`${product.name} added to cart! 🛒`);
    }
  };

  const removeItem = (uniqueId: string) => {
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
    
    const item = state.items.find(item => item.uniqueId === uniqueId);
    dispatch({ type: 'UPDATE_QUANTITY', payload: { uniqueId, quantity } });
    
    if (item) {
      showSuccess(`${item.name} quantity updated to ${quantity}`);
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    
    if (user?.id) {
      cartService.clearCart().catch(console.error);
    }
    
    showInfo('Cart cleared');
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart, isSyncing }}>
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