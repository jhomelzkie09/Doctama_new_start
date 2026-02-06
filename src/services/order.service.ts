import api, { API_URL } from '../api/config';
import axios from 'axios';
import { Order } from '../types';

class OrderService {
  async getMyOrders(page: number = 1, limit: number = 10): Promise<{
    orders: Order[];
    total: number;
    page: number;
    pages: number;
  }> {
    const response = await api.get('/orders/my-orders', {
      params: { page, limit }
    });
    return response.data;
  }

  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  }

  async createOrder(orderData: any): Promise<Order> {
    const response = await api.post('/orders', orderData);
    return response.data;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const response = await api.patch(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<Order> {
    const response = await api.patch(`/orders/${orderId}/status`, { status, trackingNumber });
    return response.data;
  }

  // Add getOrderStats method INSIDE the class
  async getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    deliveredOrders: number;
  }> {
    try {
      const response = await axios.get(`${API_URL}/orders/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
}

const orderService = new OrderService();
export default orderService;