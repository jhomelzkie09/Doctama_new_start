import api from '../api/config';
import { CartItem } from '../contexts/CartContext';

export interface BackendCartItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  selectedColor?: string;
}

export interface BackendCart {
  id: number;
  appUserId: string;
  items: BackendCartItem[];
  itemCount: number;
  totalPrice: number;
  createdAt: string;
  updatedAt?: string;
}

class CartService {
  // Get cart from backend
  async getCart(): Promise<BackendCart | null> {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Failed to get cart from backend:', error);
      return null;
    }
  }

  // Save cart to backend
  async saveCart(items: any[]): Promise<void> {
    try {
      // ✅ Validate and fix items before sending
      const validItems = items
        .filter(item => {
          const productId = item.productId || item.id;
          if (!productId || productId === 0) {
            console.error('❌ Invalid product ID:', item);
            return false;
          }
          return true;
        })
        .map(item => ({
          productId: item.productId || item.id, // ✅ Try both
          quantity: item.quantity || 1,
          selectedColor: item.selectedColor || null
        }));
      
      if (validItems.length === 0) {
        console.warn('⚠️ No valid items to save');
        return;
      }
      
      const cartDto = { items: validItems };
      console.log('📤 Sending cart to backend:', cartDto);
      
      await api.post('/cart', cartDto);
      console.log('📦 Cart synced to backend');
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    }
  }

  // Sync cart (merge local and backend)
  async syncCart(items: any[]): Promise<BackendCart | null> {
    try {
      const validItems = items
        .filter(item => {
          const productId = item.productId || item.id;
          return productId && productId > 0;
        })
        .map(item => ({
          productId: item.productId || item.id,
          quantity: item.quantity || 1,
          selectedColor: item.selectedColor || null
        }));
      
      if (validItems.length === 0) {
        console.warn('⚠️ No valid items to sync');
        return null;
      }
      
      const cartDto = { items: validItems };
      const response = await api.post('/cart/sync', cartDto);
      console.log('📦 Cart synced with backend (merged)');
      return response.data;
    } catch (error) {
      console.error('Failed to sync cart with backend:', error);
      return null;
    }
  }

  // Clear cart on backend
  async clearCart(): Promise<void> {
    try {
      await api.delete('/cart');
      console.log('📦 Cart cleared on backend');
    } catch (error) {
      console.error('Failed to clear cart on backend:', error);
    }
  }

  // Remove single item from cart
  async removeItem(itemId: number): Promise<void> {
    try {
      await api.delete(`/cart/${itemId}`);
      console.log('📦 Item removed from backend cart');
    } catch (error) {
      console.error('Failed to remove item from backend cart:', error);
    }
  }
}

export default new CartService();