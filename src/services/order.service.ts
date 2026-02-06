import api from '../api/config';
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
}

const orderService = new OrderService();
export default orderService;