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
      // If 404 or no cart, return null (not an error)
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
      const cartDto = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor || null
        }))
      };
      await api.post('/cart', cartDto);
      console.log('📦 Cart synced to backend');
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    }
  }

  // Sync cart (merge local and backend)
  async syncCart(items: any[]): Promise<BackendCart | null> {
    try {
      const cartDto = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor || null
        }))
      };
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