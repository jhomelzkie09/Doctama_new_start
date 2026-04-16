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

// ✅ Helper to strip unnecessary data before saving to localStorage
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
    // ❌ images array is excluded to prevent base64 storage
  };
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
        uniqueId,
        // Ensure images array is not duplicated
        images: undefined
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
  const [cleanupRun, setCleanupRun] = useState(false);

  const getCartStorageKey = () => {
    if (user && user.id) {
      return `cart_${user.id}`;
    }
    return 'cart_guest';
  };

  // ✅ One-time cleanup of old localStorage data
  useEffect(() => {
    if (cleanupRun) return;
    
    const cleanupOldCartData = () => {
      const cleanedKey = 'cart_cleaned_v2';
      
      if (localStorage.getItem(cleanedKey)) {
        setCleanupRun(true);
        return;
      }
      
      console.log('🧹 Running one-time cart cleanup...');
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cart_')) {
          try {
            const data = localStorage.getItem(key);
            if (data && (data.includes('data:image') || data.length > 50000)) {
              console.log(`🗑️ Deleting large cart data: ${key}`);
              localStorage.removeItem(key);
            }
          } catch (e) {
            console.error(`Failed to clean ${key}:`, e);
          }
        }
      });
      
      localStorage.setItem(cleanedKey, 'true');
      setCleanupRun(true);
      console.log('✅ Cart cleanup complete');
    };
    
    cleanupOldCartData();
  }, [cleanupRun]);

  // ✅ Save cart to backend when items change (debounced)
useEffect(() => {
  if (!isInitialized) return;
  
  const saveCartToBackend = async () => {
    console.log('🔍 saveCartToBackend triggered');
    console.log('🔍 state.items:', state.items);
    
    if (!user?.id || !hasSyncedWithBackend) {
      console.log('⚠️ Skipping save - not logged in or not synced');
      return;
    }
    
    if (state.items.length === 0) {
      console.log('⚠️ No items to save');
      return; // ✅ Don't send empty cart (clears backend)
    }
    
    try {
      const minimalItems = state.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        selectedColor: item.selectedColor || null
      }));
      
      console.log('📤 Sending to backend:', minimalItems);
      await cartService.saveCart(minimalItems);
      console.log('📦 Cart auto-saved to backend');
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    }
  };

  const timeoutId = setTimeout(saveCartToBackend, 2000);
  return () => clearTimeout(timeoutId);
}, [state.items, user?.id, hasSyncedWithBackend, isInitialized]);

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
            colorsVariant: [],
            images: undefined
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
          
          // ✅ Merge and deduplicate
          const mergedMap = new Map<string, CartItem>();
          
          // Add backend items first
          backendItems.forEach(item => {
            const key = `${item.id}-${item.selectedColor || 'default'}`;
            mergedMap.set(key, item);
          });
          
          // Add local items (if not already in backend)
          localItems.forEach(item => {
            const key = `${item.id}-${item.selectedColor || 'default'}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, item);
            }
          });
          
          const mergedItems = Array.from(mergedMap.values());
          
          if (mergedItems.length > 0) {
            dispatch({ type: 'LOAD_CART', payload: mergedItems });
            console.log('📦 Cart loaded and merged. Total items:', mergedItems.length);
            
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
              let localItems = Array.isArray(parsed) ? parsed : (parsed.items || []);
              
              // ✅ Deduplicate local items
              const dedupedMap = new Map<string, CartItem>();
              localItems.forEach((item: any) => {
                const key = `${item.id}-${item.selectedColor || 'default'}`;
                const existing = dedupedMap.get(key);
                if (existing) {
                  existing.quantity += item.quantity;
                } else {
                  dedupedMap.set(key, {
                    ...item,
                    images: undefined,
                    selectedColor: item.selectedColor && item.selectedColor.trim() !== '' ? item.selectedColor : undefined,
                    uniqueId: generateUniqueId(item.id, item.selectedColor)
                  });
                }
              });
              
              const dedupedItems = Array.from(dedupedMap.values());
              
              if (dedupedItems.length > 0) {
                console.log('📦 Uploading deduplicated local cart to backend...');
                await cartService.saveCart(dedupedItems);
                console.log('📦 Local cart uploaded to backend');
                dispatch({ type: 'LOAD_CART', payload: dedupedItems });
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
          // ✅ Deduplicate items
          const dedupedMap = new Map<string, CartItem>();
          
          items
            .filter((item: any) => item.id && item.quantity)
            .forEach((item: any) => {
              const key = `${item.id}-${item.selectedColor || 'default'}`;
              const existing = dedupedMap.get(key);
              if (existing) {
                existing.quantity += item.quantity;
              } else {
                dedupedMap.set(key, {
                  ...item,
                  images: undefined,
                  selectedColor: item.selectedColor && item.selectedColor.trim() !== '' ? item.selectedColor : undefined,
                  uniqueId: generateUniqueId(item.id, item.selectedColor)
                });
              }
            });
          
          const validItems = Array.from(dedupedMap.values());
          
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

  // ✅ Save cart to localStorage (backup) - STRIPPED VERSION
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveCart = () => {
      const storageKey = getCartStorageKey();
      
      if (state.items.length > 0) {
        // ✅ Strip unnecessary data before saving
        const itemsToStore = state.items.map(stripProductForStorage);
        localStorage.setItem(storageKey, JSON.stringify(itemsToStore));
        console.log('📦 Cart saved to localStorage (stripped)');
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
        // ✅ Only send minimal data to backend
        const minimalItems = state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor || null
        }));
        
        await cartService.saveCart(minimalItems);
        console.log('📦 Cart auto-saved to backend (minimal data)');
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
      // Update quantity if exact same item exists
      dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
      showSuccess(`${product.name} quantity increased!`);
    } else {
      // ✅ Check if the same product exists WITHOUT a color
      const sameProductNoColor = state.items.find(item => 
        item.id === product.id && !item.selectedColor
      );
      
      if (validColor && sameProductNoColor) {
        // Remove the no-color version and add the colored version
        dispatch({ type: 'REMOVE_ITEM', payload: { uniqueId: sameProductNoColor.uniqueId } });
        dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
        showSuccess(`${product.name} updated with color ${validColor}!`);
      } else {
        // Add as new item
        dispatch({ type: 'ADD_ITEM', payload: { product, color: validColor } });
        showSuccess(`${product.name} added to cart! 🛒`);
      }
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