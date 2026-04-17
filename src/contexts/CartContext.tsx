// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { showSuccess, showInfo } from '../utils/toast';
import cartService from '../services/cart.service';

// Extended CartItem with color support
export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string; // Should be string | undefined, not null
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

// ✅ Helper to normalize color (convert null/empty to undefined)
const normalizeColor = (color?: string | null): string | undefined => {
  if (color === null) return undefined;
  if (color === undefined) return undefined;
  if (color.trim() === '') return undefined;
  return color;
};

const generateUniqueId = (productId: number, color?: string | null): string => {
  const validColor = normalizeColor(color);
  return validColor ? `${productId}-${validColor.toLowerCase()}` : `${productId}`;
};

const stripProductForStorage = (item: CartItem): any => {
  // Only store essential data, never store base64 images
  const stored = {
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl || '',
    selectedColor: item.selectedColor, // Keep as is (undefined, not null)
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
  
  console.log('💾 Stripping product for storage:', { 
    id: stored.id, 
    name: stored.name,
    selectedColor: stored.selectedColor,
    selectedColorType: typeof stored.selectedColor
  });
  
  return stored;
};

const isValidProduct = (item: any): boolean => {
  if (!item) return false;
  const hasId = typeof item.id === 'number' && item.id > 0;
  const hasPrice = typeof item.price === 'number' && item.price > 0;
  const hasName = typeof item.name === 'string' && item.name.trim() !== '';
  return hasId && hasPrice && hasName;
};

const isValidCartItemForSave = (item: CartItem): boolean => {
  if (!item) return false;
  const hasId = typeof item.id === 'number' && item.id > 0;
  const hasPrice = typeof item.price === 'number' && item.price > 0;
  const hasQuantity = typeof item.quantity === 'number' && item.quantity > 0;
  const hasName = typeof item.name === 'string' && item.name.trim() !== '';
  return hasId && hasPrice && hasQuantity && hasName;
};

// ✅ Check for corrupted/suspicious data (not blocking by ID)
const hasSuspiciousData = (item: any): boolean => {
  // Check for base64 images in the item (these cause localStorage bloat)
  const itemStr = JSON.stringify(item);
  if (itemStr.includes('data:image') && itemStr.length > 50000) {
    console.warn('⚠️ Item contains large base64 image data');
    return true;
  }
  
  // Check if the entire item is oversized
  if (itemStr.length > 100000) {
    console.warn('⚠️ Item data is suspiciously large');
    return true;
  }
  
  return false;
};

// ✅ Clean item data - strip base64 images but keep the item
const cleanItemData = <T extends any>(item: T): T => {
  if (!item) return item;
  
  // If it's an object, create a clean copy preserving ALL properties
  if (typeof item === 'object' && item !== null) {
    // Create a shallow copy to avoid mutating the original
    const cleaned = Object.assign({}, item) as any;
    
    // IMPORTANT: Normalize selectedColor - convert null to undefined
    if ('selectedColor' in cleaned) {
      const originalColor = cleaned.selectedColor;
      cleaned.selectedColor = normalizeColor(originalColor);
      
      if (originalColor !== cleaned.selectedColor) {
        console.log('🔄 Normalized selectedColor:', { 
          from: originalColor, 
          to: cleaned.selectedColor,
          typeFrom: typeof originalColor,
          typeTo: typeof cleaned.selectedColor
        });
      }
    }
    
    // Remove base64 images from images array
    if (cleaned.images && Array.isArray(cleaned.images)) {
      cleaned.images = cleaned.images.filter((img: any) => {
        if (typeof img === 'string' && img.startsWith('data:image')) {
          console.log('🧹 Stripped base64 image from item');
          return false;
        }
        return true;
      });
    }
    
    // Remove any other base64 strings (but NOT selectedColor)
    Object.keys(cleaned).forEach(key => {
      // Skip selectedColor - never clean it
      if (key === 'selectedColor') return;
      
      if (typeof cleaned[key] === 'string' && cleaned[key].startsWith('data:image')) {
        console.log(`🧹 Stripped base64 from field: ${key}`);
        cleaned[key] = '';
      }
    });
    
    return cleaned;
  }
  
  return item;
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
      let { product, color } = action.payload;
      
      // ✅ Normalize the color first
      const normalizedColor = normalizeColor(color);
      
      // ✅ Clean the product data (remove base64 images, etc.)
      product = cleanItemData(product);
      
      // ✅ Validate product has required fields
      if (!isValidProduct(product)) {
        console.error('❌ BLOCKED item with invalid data:', product.id, product.name);
        return state;
      }
      
      // ✅ Warn about suspicious data but still allow
      if (hasSuspiciousData(product)) {
        console.warn('⚠️ Item has suspicious data, but allowing after cleaning:', product.id);
      }
      
      // ✅ Use normalized color
      const validColor = normalizedColor;
      const uniqueId = generateUniqueId(product.id, validColor);
      
      console.log('🎨 Adding item with color:', { 
        productId: product.id, 
        productName: product.name,
        originalColor: color,
        normalizedColor,
        validColor, 
        uniqueId 
      });
      
      const existingItem = state.items.find(item => item.uniqueId === uniqueId);
      
      if (existingItem) {
        console.log('📦 Item already exists, increasing quantity');
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
      
      // ✅ Create new item with normalized color
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedColor: validColor, // undefined for no color, string for color
        uniqueId,
        images: undefined // Never store images in cart
      };
      
      console.log('✅ Created new cart item:', { 
        id: newItem.id, 
        name: newItem.name, 
        selectedColor: newItem.selectedColor,
        selectedColorType: typeof newItem.selectedColor,
        uniqueId: newItem.uniqueId 
      });
      
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
      // ✅ Clean and validate items when loading
      const cleanedPayload = action.payload
        .map(item => {
          // Clean each item (this will normalize selectedColor)
          const cleaned = cleanItemData(item);
          
          // Check if it's valid
          if (!isValidProduct(cleaned)) {
            console.warn(`🗑️ Removed invalid item during LOAD_CART: ${item.id} - ${item.name}`);
            return null;
          }
          
          // Warn about suspicious data
          if (hasSuspiciousData(cleaned)) {
            console.warn(`⚠️ Item has suspicious data, but keeping after clean: ${item.id}`);
          }
          
          console.log('📦 Loaded cart item:', {
            id: cleaned.id,
            name: cleaned.name,
            selectedColor: cleaned.selectedColor,
            selectedColorType: typeof cleaned.selectedColor
          });
          
          return cleaned;
        })
        .filter((item): item is CartItem => item !== null);
      
      if (cleanedPayload.length !== action.payload.length) {
        console.log(`🧹 Cleaned ${action.payload.length - cleanedPayload.length} invalid items from LOAD_CART`);
      }
      
      return { 
        items: cleanedPayload, 
        total: cleanedPayload.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
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
    
    // ✅ Filter and clean items before saving
    const validItems = state.items
      .map(item => cleanItemData(item))
      .filter(item => isValidCartItemForSave(item) && !hasSuspiciousData(item));
    
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
        selectedColor: item.selectedColor || null // Backend expects null, not undefined
      }));
      
      console.log('📤 Saving cart to backend:', minimalItems);
      await cartService.saveCart(minimalItems);
      console.log('📦 Cart saved to backend successfully');
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    }
  };

  // ✅ Clean localStorage on startup (remove base64 bloat, but keep valid items)
  useEffect(() => {
    const cleanupStorage = (): void => {
      console.log('🧹 Cleaning localStorage cart data...');
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cart_')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
              
              // Check for base64 bloat
              const hasBase64 = data.includes('data:image');
              const isOversized = data.length > 50000;
              
              if (hasBase64 || isOversized) {
                console.log(`🧹 Cleaning cart data: ${key}`);
                
                // Clean each item instead of deleting everything
                const cleanedItems = items
                  .map((item: any) => cleanItemData(item))
                  .filter((item: any) => isValidProduct(item));
                
                if (cleanedItems.length > 0) {
                  const cleanData = JSON.stringify(cleanedItems);
                  localStorage.setItem(key, cleanData);
                  console.log(`✅ Restored ${cleanedItems.length} cleaned items to ${key}`);
                } else {
                  localStorage.removeItem(key);
                  console.log(`🗑️ Removed empty cart: ${key}`);
                }
              }
            }
          } catch (e) {
            console.error(`Failed to process ${key}:`, e);
            localStorage.removeItem(key);
          }
        }
      });
      
      console.log('✅ localStorage cleanup complete');
    };
    
    cleanupStorage();
  }, [user?.id]);

  // ✅ Load cart from backend when user logs in
  // Replace the loadCartFromBackend function with this:

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
        console.log('📦 Raw backend items:', backendCart.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          selectedColor: item.selectedColor,
          selectedColorType: typeof item.selectedColor
        })));
        
        // ✅ Clean and validate items from backend
        const validItems = backendCart.items.filter(item => {
          // Check required fields
          if (!item.productId || item.productId <= 0) {
            console.warn(`🗑️ Item with invalid productId: ${item.productId}`);
            return false;
          }
          
          if (!item.unitPrice || item.unitPrice <= 0) {
            console.warn(`🗑️ Item with invalid price: ${item.unitPrice}`);
            return false;
          }
          
          if (!item.productName || item.productName.trim() === '') {
            console.warn(`🗑️ Item with empty name`);
            return false;
          }
          
          return true;
        });
        
        if (validItems.length === 0) {
          console.log('⚠️ No valid items in backend cart - clearing');
          await cartService.clearCart();
          setHasSyncedWithBackend(true);
          setIsSyncing(false);
          setIsInitialSync(false);
          setIsInitialized(true);
          return;
        }
        
        const backendItems: CartItem[] = validItems.map(item => {
          // ✅ IMPORTANT: Don't normalize null to undefined if the item actually has no color
          // Only normalize if it's explicitly null (meaning no color was selected)
          const selectedColor = item.selectedColor === null ? undefined : item.selectedColor;
          
          console.log('📦 Processing backend item:', {
            productId: item.productId,
            productName: item.productName,
            originalSelectedColor: item.selectedColor,
            processedSelectedColor: selectedColor
          });
          
          return {
            id: item.productId,
            name: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            imageUrl: item.imageUrl || '',
            selectedColor: selectedColor,
            uniqueId: generateUniqueId(item.productId, selectedColor),
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
          };
        });
        
        if (backendItems.length > 0) {
          // Clean items before dispatching
          const cleanedItems = backendItems.map(item => {
            // Don't use cleanItemData on the color - preserve it exactly
            const cleaned = cleanItemData(item);
            // Ensure selectedColor is preserved
            cleaned.selectedColor = item.selectedColor;
            return cleaned;
          });
          
          console.log('📦 Final items being dispatched:', cleanedItems.map(item => ({
            id: item.id,
            name: item.name,
            selectedColor: item.selectedColor
          })));
          
          dispatch({ type: 'LOAD_CART', payload: cleanedItems });
          console.log('📦 Cart loaded from backend. Total items:', cleanedItems.length);
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

  // ✅ Save cart to localStorage (backup) - clean data before saving
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveCart = (): void => {
      const storageKey = getCartStorageKey();
      
      if (state.items.length > 0) {
        // Clean items before saving
        const cleanedItems = state.items
          .map(item => cleanItemData(item))
          .filter(item => isValidCartItemForSave(item));
        
        if (cleanedItems.length > 0) {
          const itemsToStore = cleanedItems.map(stripProductForStorage);
          const jsonData = JSON.stringify(itemsToStore);
          
          // Only save if data size is reasonable
          if (jsonData.length < 100000) {
            localStorage.setItem(storageKey, jsonData);
            console.log('📦 Cart saved to localStorage with items:', itemsToStore.length);
          } else {
            console.warn('⚠️ Cart data too large, skipping localStorage save');
          }
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
  // ✅ Normalize the color first
  const normalizedColor = normalizeColor(color);
  
  // ✅ Clean the product data first
  const cleanedProduct = cleanItemData(product);
  
  // ✅ Validate product has required fields
  if (!isValidProduct(cleanedProduct)) {
    console.error('❌ Cannot add invalid product to cart:', cleanedProduct.id, cleanedProduct.name);
    showInfo('Unable to add this product to cart');
    return;
  }
  
  console.log('🛒 addItem called for:', {
    name: cleanedProduct.name,
    id: cleanedProduct.id,
    originalColor: color,
    normalizedColor,
    productColorsVariant: product.colorsVariant
  });
  
  userActionRef.current = true;
  
  const validColor = normalizedColor;
  const uniqueId = generateUniqueId(cleanedProduct.id, validColor);
  const existingItem = state.items.find(item => item.uniqueId === uniqueId);
  
  if (existingItem) {
    dispatch({ type: 'ADD_ITEM', payload: { product: cleanedProduct, color: validColor } });
    showSuccess(`${cleanedProduct.name} quantity increased!`);
  } else {
    const sameProductNoColor = state.items.find(item => 
      item.id === cleanedProduct.id && !item.selectedColor
    );
    
    if (validColor && sameProductNoColor) {
      dispatch({ type: 'REMOVE_ITEM', payload: { uniqueId: sameProductNoColor.uniqueId } });
      dispatch({ type: 'ADD_ITEM', payload: { product: cleanedProduct, color: validColor } });
      showSuccess(`${cleanedProduct.name} updated with color ${validColor}!`);
    } else {
      dispatch({ type: 'ADD_ITEM', payload: { product: cleanedProduct, color: validColor } });
      showSuccess(`${cleanedProduct.name} added to cart! 🛒`);
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