import api from '../api/config';
import { Order, OrderItem, ApiOrder, ApiOrderItem } from '../types';

class OrderService {
  private readonly baseUrl = '/orders';

  // Convert API order to frontend Order type
  private convertApiOrderToOrder(apiOrder: ApiOrder): Order {
    // Convert API items to frontend OrderItem format
    const items: OrderItem[] = (apiOrder.items || []).map((item: ApiOrderItem) => ({
      id: item.id.toString(),
      productId: item.productId.toString(),
      productName: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
      unitPrice: item.unitPrice,
      imageUrl: item.imageUrl || '',
    }));

    return {
      id: apiOrder.id.toString(),
      orderNumber: apiOrder.orderNumber,
      userId: apiOrder.userId || '',
      orderDate: apiOrder.orderDate,
      totalAmount: apiOrder.totalAmount,
      status: apiOrder.status as any,
      paymentStatus: apiOrder.paymentStatus as any,
      paymentMethod: apiOrder.paymentMethod as any,
      items: items,
      shippingAddress: apiOrder.shippingAddress,
      customerName: apiOrder.customerName,
      customerEmail: apiOrder.customerEmail,
      customerPhone: apiOrder.customerPhone,
      paymentProof: apiOrder.paymentProofImage ? {
        receiptImage: apiOrder.paymentProofImage,
        referenceNumber: apiOrder.paymentProofReference || '',
        senderName: apiOrder.paymentProofSender || '',
        paymentDate: apiOrder.paymentProofDate || '',
        notes: apiOrder.paymentProofNotes
      } : undefined,
      notes: apiOrder.rejectionReason,
      createdAt: apiOrder.createdAt,
      updatedAt: apiOrder.updatedAt
    };
  }

  // Get orders for current user
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      console.log(`📤 Fetching orders for user...`);
      const response = await api.get(`${this.baseUrl}/my-orders`);
      console.log('✅ User orders fetched:', response.data);
      
      let ordersData: ApiOrder[] = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      }
      
      // Convert each API order to frontend Order type
      return ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
    } catch (error: any) {
      console.error('❌ Error fetching user orders:', error.response?.data || error.message);
      return [];
    }
  }

  async updateOrderPayment(id: number, status: string, details?: any): Promise<Order> {
    try {
      console.log(`📤 Updating order ${id} payment status to ${status}...`);
      const response = await api.put(`${this.baseUrl}/admin/${id}/payment`, { status, details });
      console.log('✅ Order payment updated:', response.data);
      return this.convertApiOrderToOrder(response.data);
    } catch (error: any) {
      console.error('❌ Error updating payment:', error.response?.data || error.message);
      throw error;
    }
  }

  async createOrder(orderData: any): Promise<Order> {
    try {
      console.log('📤 Creating order...', orderData);
      const response = await api.post(this.baseUrl, orderData);
      console.log('✅ Order created:', response.data);
      return this.convertApiOrderToOrder(response.data);
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
      const response = await api.get(`${this.baseUrl}/my-orders`, {
        params: { page, limit }
      });
      console.log('✅ Orders fetched:', response.data);
      
      let ordersData: ApiOrder[] = [];
      let total = 0;
      
      if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
        total = response.data.total || ordersData.length;
      } else if (Array.isArray(response.data)) {
        ordersData = response.data;
        total = ordersData.length;
      }
      
      // Convert each API order to frontend Order type
      const orders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      
      return {
        orders,
        total: total,
        page: response.data.page || page,
        pages: response.data.pages || Math.ceil(total / limit)
      };
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

  // Get order by ID with proper items mapping
  async getOrderById(id: number): Promise<Order | null> {
    try {
      console.log(`📤 Fetching order ${id}...`);
      const response = await api.get(`${this.baseUrl}/my-orders/${id}`);
      console.log('✅ Order fetched:', response.data);
      
      const apiOrder: ApiOrder = response.data;
      console.log('📦 API Order items:', apiOrder.items?.length || 0, 'items');
      
      // Convert API order to frontend Order type
      const order = this.convertApiOrderToOrder(apiOrder);
      console.log('📦 Converted order items:', order.items?.length || 0, 'items');
      
      return order;
    } catch (error: any) {
      console.error(`❌ Error fetching order ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Get all orders (admin only)
  async getAllOrders(): Promise<Order[]> {
    try {
      console.log('📤 Fetching all orders (admin)...');
      const response = await api.get(`${this.baseUrl}/my-orders`);
      console.log('✅ Orders fetched:', response.data);
      
      let ordersData: ApiOrder[] = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      }
      
      // Convert each API order to frontend Order type
      return ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
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
      return this.convertApiOrderToOrder(response.data);
    } catch (error: any) {
      console.error('❌ Error updating order:', error.response?.data || error.message);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService;