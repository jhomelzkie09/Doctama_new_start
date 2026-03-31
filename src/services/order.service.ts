import api from '../api/config';
import { Order, OrderItem, ApiOrder, ApiOrderItem } from '../types';

class OrderService {
  private readonly baseUrl = '/orders';

  // Convert API order to frontend Order type
  private convertApiOrderToOrder(apiOrder: any): Order {
    console.log('🔄 Converting API order:', apiOrder.id);
    
    // Check if items exist in the response - handle multiple possible property names
    const itemsData = apiOrder.items || apiOrder.Items || [];
    console.log(`📦 Items data for order ${apiOrder.id}:`, itemsData);
    console.log(`📦 Items count:`, itemsData.length);
    
    // Convert API items to frontend OrderItem format
    const items: OrderItem[] = itemsData.map((item: any, index: number) => {
      console.log(`  Item ${index + 1}:`, item);
      return {
        id: item.id?.toString() || '',
        productId: item.productId?.toString() || '',
        productName: item.productName || item.ProductName || '',
        quantity: item.quantity || item.Quantity || 0,
        price: item.unitPrice || item.UnitPrice || item.price || 0,
        unitPrice: item.unitPrice || item.UnitPrice || item.price || 0,
        imageUrl: item.imageUrl || item.ImageUrl || '',
        color: item.color || '',
        size: item.size || ''
      };
    });

    const convertedOrder: Order = {
      id: apiOrder.id?.toString() || '',
      orderNumber: apiOrder.orderNumber || apiOrder.OrderNumber || '',
      userId: apiOrder.userId || '',
      orderDate: apiOrder.orderDate || apiOrder.OrderDate || new Date().toISOString(),
      totalAmount: apiOrder.totalAmount || apiOrder.TotalAmount || 0,
      status: apiOrder.status || apiOrder.Status || 'pending',
      paymentStatus: apiOrder.paymentStatus || apiOrder.PaymentStatus || 'pending',
      paymentMethod: apiOrder.paymentMethod || apiOrder.PaymentMethod || 'cod',
      items: items,
      shippingAddress: apiOrder.shippingAddress || apiOrder.ShippingAddress || '',
      customerName: apiOrder.customerName || apiOrder.CustomerName,
      customerEmail: apiOrder.customerEmail || apiOrder.CustomerEmail,
      customerPhone: apiOrder.customerPhone || apiOrder.CustomerPhone,
      paymentProof: apiOrder.paymentProofImage ? {
        receiptImage: apiOrder.paymentProofImage,
        referenceNumber: apiOrder.paymentProofReference || '',
        senderName: apiOrder.paymentProofSender || '',
        paymentDate: apiOrder.paymentProofDate || '',
        notes: apiOrder.paymentProofNotes
      } : undefined,
      notes: apiOrder.notes,
      createdAt: apiOrder.createdAt,
      updatedAt: apiOrder.updatedAt
    };
    
    console.log(`✅ Converted order ${convertedOrder.id}: ${convertedOrder.items.length} items`);
    
    return convertedOrder;
  }

  // Get orders for current user
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      console.log(`📤 Fetching orders for user...`);
      const response = await api.get(`${this.baseUrl}/my-orders`);
      console.log('✅ User orders fetched:', response.data);
      
      let ordersData: any[] = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      }
      
      console.log('📦 Orders data count:', ordersData.length);
      
      // Convert each API order to frontend Order type
      const convertedOrders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      
      // Log summary of items found
      const totalItems = convertedOrders.reduce((sum, order) => sum + order.items.length, 0);
      console.log(`📊 Total items across all orders: ${totalItems}`);
      
      return convertedOrders;
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
      const convertedOrder = this.convertApiOrderToOrder(response.data);
      console.log(`📊 Created order with ${convertedOrder.items.length} items`);
      return convertedOrder;
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
      
      let ordersData: any[] = [];
      let total = 0;
      
      if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
        total = response.data.total || ordersData.length;
      } else if (Array.isArray(response.data)) {
        ordersData = response.data;
        total = ordersData.length;
      }
      
      console.log('📦 Orders data count:', ordersData.length);
      
      // Convert each API order to frontend Order type
      const orders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      
      // Log items summary
      const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
      console.log(`📊 Total items across ${orders.length} orders: ${totalItems}`);
      
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
      console.log('✅ Order fetched successfully');
      
      const apiOrder = response.data;
      console.log(`📦 API Order has items:`, apiOrder.items?.length || apiOrder.Items?.length || 0);
      
      // Log the raw items from API for debugging
      const rawItems = apiOrder.items || apiOrder.Items || [];
      if (rawItems.length > 0) {
        console.log('📦 Raw items from API:', rawItems);
      }
      
      // Convert API order to frontend Order type
      const order = this.convertApiOrderToOrder(apiOrder);
      console.log(`✅ Converted order ${order.id} has ${order.items.length} items`);
      
      // Log each item details
      if (order.items.length > 0) {
        console.log('📋 Order items details:');
        order.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.productName} - Qty: ${item.quantity} - Price: ₱${item.price}`);
        });
      } else {
        console.warn(`⚠️ Order ${id} has no items!`);
      }
      
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
      const response = await api.get(`${this.baseUrl}/admin/all`);
      console.log('✅ Orders fetched:', response.data);
      
      let ordersData: any[] = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      }
      
      console.log('📦 Orders data count:', ordersData.length);
      
      // Convert each API order to frontend Order type
      const convertedOrders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      
      // Log summary
      const totalItems = convertedOrders.reduce((sum, order) => sum + order.items.length, 0);
      console.log(`📊 Total items across ${convertedOrders.length} orders: ${totalItems}`);
      
      return convertedOrders;
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