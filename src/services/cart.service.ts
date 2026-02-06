import api from '../api/config';
import { Cart, ApiResponse } from '../types';

class CartService {
  async getCart(): Promise<Cart> {
    const response = await api.get<ApiResponse<Cart>>('/cart/my-cart');
    return response.data?.data || this.getEmptyCart();
  }

  async addToCart(productId: number, quantity: number = 1): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/cart/add-item', {
      productId,
      quantity
    });
    return response.data;
  }

  async updateCartItem(itemId: number, quantity: number): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>(`/cart/update-item/${itemId}`, {
      quantity
    });
    return response.data;
  }

  async removeFromCart(itemId: number): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/cart/remove-item/${itemId}`);
    return response.data;
  }

  async checkout(): Promise<ApiResponse<{ orderId: number; totalAmount: number }>> {
    const response = await api.post<ApiResponse<{ orderId: number; totalAmount: number }>>('/cart/checkout');
    return response.data;
  }

  async clearCart(): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>('/cart/clear');
    return response.data;
  }

  private getEmptyCart(): Cart {
    return {
      id: 0,
      createdAt: new Date().toISOString(),
      itemCount: 0,
      items: [],
      totalPrice: 0
    };
  }
}

const cartService = new CartService();
export default cartService;