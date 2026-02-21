import api from '../api/config';
import { Order } from '../types';

class OrderService {
  private readonly baseUrl = '/orders';

  async createOrder(orderData: any): Promise<Order> {
    try {
      console.log('📤 Creating order...', orderData);
      const response = await api.post(this.baseUrl, orderData);
      console.log('✅ Order created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating order:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMyOrders(page: number = 1, limit: number = 10): Promise<{
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}> {
  try {
    console.log('📤 Fetching my orders...');
    const response = await api.get(`${this.baseUrl}/my-orders?page=${page}&limit=${limit}`);
    console.log('✅ Orders fetched:', response.data);
    
    // Handle different response formats
    if (response.data.orders && Array.isArray(response.data.orders)) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return {
        orders: response.data,
        total: response.data.length,
        page: 1,
        pages: 1
      };
    } else {
      return {
        orders: [],
        total: 0,
        page: 1,
        pages: 1
      };
    }
  } catch (error: any) {
    console.error('❌ Error fetching orders:', error.response?.data || error.message);
    return {
      orders: [],
      total: 0,
      page: 1,
      pages: 1
    };
  }
}

  async getOrderById(id: number): Promise<Order | null> {
    try {
      console.log(`📤 Fetching order ${id}...`);
      const response = await api.get(`${this.baseUrl}/my-orders/${id}`);
      console.log('✅ Order fetched:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching order:', error.response?.data || error.message);
      return null;
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      console.log('📤 Fetching all orders (admin)...');
      const response = await api.get(`${this.baseUrl}/admin/all`);
      console.log('✅ Orders fetched:', response.data);
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error.response?.data || error.message);
      return [];
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    try {
      console.log(`📤 Updating order ${id} status to ${status}...`);
      const response = await api.put(`${this.baseUrl}/admin/${id}/status`, { status });
      console.log('✅ Order updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating order:', error.response?.data || error.message);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService;