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

// ✅ ROGUE PRODUCT IDs - Block these completely
const ROGUE_PRODUCT_IDS = [34, 35];

// ✅ Helper to check if an item is a known rogue item
const isRogueItem = (productId: number): boolean => {
  return ROGUE_PRODUCT_IDS.includes(productId);
};

// ✅ Check if an item has valid product data
const hasValidProductData = (item: any): boolean => {
  // Rogue items often have empty descriptions, 0 stock, etc.
  if (!item.name || item.name === '') return false;
  if (!item.price || item.price <= 0) return false;
  if (item.description === '' && ROGUE_PRODUCT_IDS.includes(item.id)) return false;
  return true;
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
      
      // ✅ Block rogue items at the reducer level
      if (isRogueItem(product.id)) {
        console.error('⚠️⚠️⚠️ BLOCKED rogue item in reducer:', product.id, product.name);
        return state;
      }
      
      // ✅ Also check for valid product data
      if (!hasValidProductData(product)) {
        console.error('⚠️⚠️⚠️ BLOCKED item with invalid data:', product.id, product.name);
        return state;
      }
      
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

    case 'LOAD_CART': {
      // ✅ AGGRESSIVELY filter out rogue items when loading cart
      const filteredPayload = action.payload.filter(item => {
        // Block by ID
        if (isRogueItem(item.id)) {
          console.warn(`🗑️ BLOCKED rogue item from LOAD_CART (ID): ${item.id} - ${item.name}`);
          return false;
        }
        
        // Block by invalid data
        if (!hasValidProductData(item)) {
          console.warn(`🗑️ BLOCKED item with invalid data: ${item.id} - ${item.name}`);
          return false;
        }
        
        // Block items with suspiciously large data (base64 images)
        const itemStr = JSON.stringify(item);
        if (itemStr.includes('data:image') && itemStr.length > 10000) {
          console.warn(`🗑️ BLOCKED item with large base64 image: ${item.id} - ${item.name}`);
          return false;
        }
        
        return true;
      });
      
      if (filteredPayload.length !== action.payload.length) {
        console.log(`🧹 Filtered out ${action.payload.length - filteredPayload.length} rogue items from LOAD_CART`);
      }
      
      return { 
        items: filteredPayload, 
        total: filteredPayload.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
      };
    }
      
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
    
    // ✅ Filter out rogue items before saving
    const validItems = state.items
      .filter(item => {
        if (isRogueItem(item.id)) {
          console.warn(`🗑️ BLOCKED rogue item from save: ID ${item.id} - ${item.name}`);
          return false;
        }
        if (!hasValidProductData(item)) {
          console.warn(`🗑️ BLOCKED item with invalid data from save: ${item.id}`);
          return false;
        }
        return isValidCartItemForSave(item);
      });
    
    if (validItems.length === 0) {
      console.log('⚠️ No valid items to save - clearing backend cart');
      try {
        await cartService.clearCart();
      } catch (e) {
        console.error('Failed to clear backend cart:', e);
      }
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
    const aggressiveCleanup = async (): Promise<void> => {
      console.log('🧹 Running aggressive cart cleanup...');
      
      let foundRogueItem = false;
      
      // Check all localStorage cart keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cart_')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
              
              // Check for rogue items by ID
              const hasRogueById = items.some((item: any) => 
                ROGUE_PRODUCT_IDS.includes(item.id)
              );
              
              // Check for items with suspicious data
              const hasInvalidData = items.some((item: any) => 
                !item.name || item.name === '' || !item.price || item.price <= 0
              );
              
              const hasBase64 = data.includes('data:image');
              const isOversized = data.length > 50000;
              
              if (hasRogueById || hasInvalidData || hasBase64 || isOversized) {
                console.log(`🗑️ Deleting suspicious cart data: ${key}`, {
                  hasRogueById,
                  hasInvalidData,
                  hasBase64,
                  isOversized
                });
                localStorage.removeItem(key);
                foundRogueItem = true;
              }
            }
          } catch (e) {
            console.error(`Failed to parse ${key}:`, e);
            localStorage.removeItem(key);
            foundRogueItem = true;
          }
        }
      });
      
      // ✅ If we found rogue items and user is logged in, clear backend cart too
      if (foundRogueItem && user?.id) {
        try {
          console.log('🧹 Clearing backend cart due to rogue items...');
          await cartService.clearCart();
          console.log('✅ Backend cart cleared');
        } catch (e) {
          console.error('Failed to clear backend cart:', e);
        }
      }
      
      console.log('✅ Aggressive cleanup complete');
    };
    
    aggressiveCleanup();
  }, [user?.id]);

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
          
          // ✅ AGGRESSIVELY FILTER OUT ROGUE ITEMS FROM BACKEND
          const filteredItems = backendCart.items.filter(item => {
            // Block by ID
            if (ROGUE_PRODUCT_IDS.includes(item.productId)) {
              console.warn(`🗑️ IGNORING rogue item from backend (ID): ${item.productId}`);
              return false;
            }
            
            // Block invalid product data
            if (!item.productId || item.productId <= 0) {
              console.warn(`🗑️ IGNORING item with invalid productId: ${item.productId}`);
              return false;
            }
            
            if (!item.unitPrice || item.unitPrice <= 0) {
              console.warn(`🗑️ IGNORING item with invalid price: ${item.unitPrice}`);
              return false;
            }
            
            if (!item.productName || item.productName === '') {
              console.warn(`🗑️ IGNORING item with empty name`);
              return false;
            }
            
            return true;
          });
          
          if (filteredItems.length === 0) {
            console.log('⚠️ All backend items were invalid - clearing backend cart');
            await cartService.clearCart();
            setHasSyncedWithBackend(true);
            setIsSyncing(false);
            setIsInitialSync(false);
            setIsInitialized(true);
            return;
          }
          
          if (filteredItems.length !== backendCart.items.length) {
            console.log(`🧹 Filtered out ${backendCart.items.length - filteredItems.length} rogue items from backend`);
            // Clear and re-save valid items only
            await cartService.clearCart();
            const validMinimalItems = filteredItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              selectedColor: item.selectedColor || null
            }));
            await cartService.saveCart(validMinimalItems);
          }
          
          const backendItems: CartItem[] = filteredItems.map(item => ({
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

  // ✅ Save cart to localStorage (backup) - with aggressive filtering
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveCart = (): void => {
      const storageKey = getCartStorageKey();
      
      if (state.items.length > 0) {
        // ✅ Filter out rogue items before saving to localStorage
        const validItems = state.items.filter(item => {
          if (isRogueItem(item.id)) {
            console.warn(`🗑️ BLOCKED rogue item from localStorage: ID ${item.id} - ${item.name}`);
            return false;
          }
          if (!hasValidProductData(item)) {
            console.warn(`🗑️ BLOCKED item with invalid data from localStorage: ${item.id}`);
            return false;
          }
          return isValidCartItemForSave(item);
        });
        
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
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (userActionRef.current) {
      console.log('⚡ User action detected - saving immediately');
      userActionRef.current = false;
      saveToBackend();
      return;
    }
    
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

  const addItem = (product: Product, color?: string): void => {
    // ✅ Block rogue items at the entry point
    if (isRogueItem(product.id)) {
      console.error('⚠️⚠️⚠️ BLOCKED rogue item in addItem:', product.id, product.name);
      showInfo('This product is currently unavailable');
      return;
    }
    
    if (!isValidProduct(product)) {
      console.error('❌ Cannot add invalid product to cart:', product);
      return;
    }
    
    if (!hasValidProductData(product)) {
      console.error('❌ Cannot add product with invalid data:', product);
      return;
    }
    
    console.log('🛒 addItem called for:', product.name);
    
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
    
    userActionRef.current = true;
    
    dispatch({ type: 'UPDATE_QUANTITY', payload: { uniqueId, quantity } });
    
    if (item) {
      showSuccess(`${item.name} quantity updated to ${quantity}`);
    }
  };

  const clearCart = (): void => {
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