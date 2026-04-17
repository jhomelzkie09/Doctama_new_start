// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { showSuccess, showInfo } from '../utils/toast';
import cartService from '../services/cart.service';

// Extended CartItem with color support
export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  uniqueId: string;
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

const generateUniqueId = (productId: number, color?: string): string => {
  const validColor = color && color.trim() !== '' ? color : undefined;
  return validColor ? `${productId}-${validColor.toLowerCase()}` : `${productId}`;
};

const stripProductForStorage = (item: CartItem): any => {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl || '',
    selectedColor: item.selectedColor,
    uniqueId: item.uniqueId,
    description: item.description || '',
    categoryId: item.categoryId,
    stockQuantity: item.stockQuantity,
    isActive: item.isActive,
    createdAt: item.createdAt,
    height: item.height || 0,
    width: item.width || 0,
    length: item.length || 0,
    colorsVariant: item.colorsVariant || []
  };
};

const isValidProduct = (item: any): boolean => {
  if (!item) return false;
  const hasId = typeof item.id === 'number' && item.id > 0;
  const hasPrice = typeof item.price === 'number' && item.price > 0;
  return hasId && hasPrice;
};

const isValidCartItemForSave = (item: CartItem): boolean => {
  if (!item) return false;
  const hasId = typeof item.id === 'number' && item.id > 0;
  const hasPrice = typeof item.price === 'number' && item.price > 0;
  const hasQuantity = typeof item.quantity === 'number' && item.quantity > 0;
  return hasId && hasPrice && hasQuantity;
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

   if (action.type === 'ADD_ITEM') {
    const product = action.payload.product;
    console.trace(`🔴 ADD_ITEM reducer: ${product.name} (ID: ${product.id})`);
    
    if (product.id === 35 || product.id === 34) {
      console.error('⚠️⚠️⚠️ ROGUE ITEM IN REDUCER!');
      console.log('Action:', action);
      console.log('Current state items:', state.items.map(i => ({ id: i.id, name: i.name })));
      debugger;
    }
  }

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
        uniqueId,
        images: undefined
      };
      
      return {
        items: [...state.items, newItem],
        total: state.total + product.price
      };
    }
    
    case 'REMOVE_ITEM': {
      const item = state.items.find(item => item.uniqueId === action.payload.uniqueId);
      if (!item) return state;
      return {
        items: state.items.filter(item => item.uniqueId !== action.payload.uniqueId),
        total: state.total - (item.price * item.quantity)
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
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasSyncedWithBackend, setHasSyncedWithBackend] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitialSync, setIsInitialSync] = useState<boolean>(true);
  
  // ✅ Flag to track if save was triggered by user action (should be immediate)
  const userActionRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCartStorageKey = (): string => {
    if (user && user.id) {
      return `cart_${user.id}`;
    }
    return 'cart_guest';
  };

  // ✅ Helper function to actually save to backend
  const saveToBackend = async (): Promise<void> => {
    if (!user?.id) return;
    
    const validItems = state.items.filter(isValidCartItemForSave);
    
    if (validItems.length === 0) {
      console.log('⚠️ No valid items to save');
      return;
    }
    
    try {
      const minimalItems = validItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        selectedColor: item.selectedColor || null
      }));
      
      console.log('📤 Saving cart to backend:', minimalItems);
      await cartService.saveCart(minimalItems);
      console.log('📦 Cart saved to backend successfully');
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    }
  };

  // ✅ AGGRESSIVE CLEANUP - Remove all suspicious cart data on startup
  useEffect(() => {
    const aggressiveCleanup = (): void => {
      console.log('🧹 Running aggressive cart cleanup...');
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cart_')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
              
              const hasRogueItem = items.some((item: any) => 
                (item.id === 34 || item.id === 35) && (!item.description || item.description === '')
              );
              
              const hasBase64 = data.includes('data:image');
              const isOversized = data.length > 50000;
              
              if (hasRogueItem || hasBase64 || isOversized) {
                console.log(`🗑️ Deleting suspicious cart data: ${key}`);
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            console.error(`Failed to parse ${key}:`, e);
            localStorage.removeItem(key);
          }
        }
      });
      
      console.log('✅ Aggressive cleanup complete');
    };
    
    aggressiveCleanup();
  }, []);

  // ✅ Load cart from backend when user logs in
  useEffect(() => {
    const loadCartFromBackend = async (): Promise<void> => {
      if (!user?.id || hasSyncedWithBackend) return;
      
      setIsSyncing(true);
      setIsInitialSync(true);
      console.log('📦 Loading cart from backend for user:', user.id);
      
      try {
        const backendCart = await cartService.getCart();
        
        if (backendCart && backendCart.items && backendCart.items.length > 0) {
          console.log('📦 Found backend cart with', backendCart.items.length, 'items');
          
          const backendItems: CartItem[] = backendCart.items
            .filter(item => item.productId && item.productId > 0 && item.unitPrice > 0)
            .map(item => ({
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
              colorsVariant: [],
              images: undefined
            }));
          
          if (backendItems.length > 0) {
            dispatch({ type: 'LOAD_CART', payload: backendItems });
            console.log('📦 Cart loaded from backend. Total items:', backendItems.length);
          } else {
            console.log('⚠️ Backend cart had invalid items, clearing...');
            await cartService.clearCart();
          }
        } else {
          console.log('📦 No backend cart found');
        }
        
        setHasSyncedWithBackend(true);
      } catch (error) {
        console.error('Failed to load cart from backend:', error);
      } finally {
        setIsSyncing(false);
        setIsInitialSync(false);
        setIsInitialized(true);
      }
    };

    loadCartFromBackend();
  }, [user?.id, hasSyncedWithBackend]);

  // ✅ Save cart to localStorage (backup)
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveCart = (): void => {
      const storageKey = getCartStorageKey();
      
      if (state.items.length > 0) {
        const validItems = state.items.filter(isValidCartItemForSave);
        if (validItems.length > 0) {
          const itemsToStore = validItems.map(stripProductForStorage);
          localStorage.setItem(storageKey, JSON.stringify(itemsToStore));
          console.log('📦 Cart saved to localStorage');
        } else {
          localStorage.removeItem(storageKey);
        }
      } else {
        localStorage.removeItem(storageKey);
      }
    };

    saveCart();
  }, [state.items, user?.id, isInitialized]);

  // ✅ Save cart to backend when items change
  // If triggered by user action -> SAVE IMMEDIATELY
  // Otherwise -> DEBOUNCE
  useEffect(() => {
    if (isInitialSync) {
      console.log('⏳ Initial sync in progress, skipping save');
      return;
    }
    
    if (!isInitialized) {
      console.log('⏳ Not initialized, skipping save');
      return;
    }
    
    if (!user?.id) {
      console.log('⚠️ No user, skipping save');
      return;
    }
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // ✅ If this was triggered by a user action, save IMMEDIATELY
    if (userActionRef.current) {
      console.log('⚡ User action detected - saving immediately');
      userActionRef.current = false;
      saveToBackend();
      return;
    }
    
    // Otherwise, debounce (for programmatic updates)
    console.log('⏳ Debouncing save...');
    saveTimeoutRef.current = setTimeout(() => {
      saveToBackend();
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.items, user?.id, isInitialized, isInitialSync]);

  // ✅ USER ACTIONS - Mark as user action and dispatch
  const addItem = (product: Product, color?: string): void => {

    // At the top of CartProvider, add this:
const originalDispatch = dispatch;

// Wrap dispatch to log all cart actions
const debugDispatch = (action: CartAction): void => {
  if (action.type === 'ADD_ITEM') {
    const product = action.payload.product;
    console.trace(`🔴🔴🔴 ADD_ITEM called for: ${product.name} (ID: ${product.id})`);
    console.log('🔴 Color:', action.payload.color);
    
    // If it's the rogue item, pause execution to inspect
    if (product.id === 35 || product.id === 34) {
      console.error('⚠️⚠️⚠️ ROGUE ITEM BEING ADDED!');
      console.log('Product:', product);
      debugger; // This will pause the debugger if DevTools is open
    }
  }
  originalDispatch(action);
};

// Use debugDispatch instead of dispatch in the reducer
    if (!isValidProduct(product)) {
      console.error('❌ Cannot add invalid product to cart:', product);
      return;
    }
    
    console.log('🛒 addItem called for:', product.name);
    
    // ✅ Mark as user action for immediate save
    userActionRef.current = true;
    
    const validColor = color && color.trim() !== '' ? color : undefined;
    const uniqueId = generateUniqueId(product.id, validColor);
    const existingItem = state.items.find(item => item.uniqueId === uniqueId);
    
    if (existingItem) {
      dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
      showSuccess(`${product.name} quantity increased!`);
    } else {
      const sameProductNoColor = state.items.find(item => 
        item.id === product.id && !item.selectedColor
      );
      
      if (validColor && sameProductNoColor) {
        dispatch({ type: 'REMOVE_ITEM', payload: { uniqueId: sameProductNoColor.uniqueId } });
        dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
        showSuccess(`${product.name} updated with color ${validColor}!`);
      } else {
        dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
        showSuccess(`${product.name} added to cart! 🛒`);
      }
    }
  };

  const removeItem = (uniqueId: string): void => {
    const item = state.items.find(item => item.uniqueId === uniqueId);
    
    // ✅ Mark as user action for immediate save
    userActionRef.current = true;
    
    dispatch({ type: 'REMOVE_ITEM', payload: { uniqueId } });
    if (item) {
      showInfo(`${item.name} removed from cart`);
    }
  };

  const updateQuantity = (uniqueId: string, quantity: number): void => {
    if (quantity < 1) {
      removeItem(uniqueId);
      return;
    }
    
    const item = state.items.find(item => item.uniqueId === uniqueId);
    
    // ✅ Mark as user action for immediate save
    userActionRef.current = true;
    
    dispatch({ type: 'UPDATE_QUANTITY', payload: { uniqueId, quantity } });
    
    if (item) {
      showSuccess(`${item.name} quantity updated to ${quantity}`);
    }
  };

  const clearCart = (): void => {
    // ✅ Mark as user action for immediate save
    userActionRef.current = true;
    
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

export const useCart = (): {
  state: CartState;
  addItem: (product: Product, color?: string) => void;
  removeItem: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  isSyncing: boolean;
} => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};