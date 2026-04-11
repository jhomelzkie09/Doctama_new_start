import api from '../api/config';
import { Order, OrderItem, ApiOrder, ApiOrderItem } from '../types';

class OrderService {
  private readonly baseUrl = '/orders';

  // Convert API order to frontend Order type
  private convertApiOrderToOrder(apiOrder: any): Order {
    
    // Check if items exist in the response - handle multiple possible property names
    const itemsData = apiOrder.items || apiOrder.Items || [];

    
    // Convert API items to frontend OrderItem format
    const items: OrderItem[] = itemsData.map((item: any, index: number) => {

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
      // Keep the paymentProof object for backward compatibility
      paymentProof: apiOrder.paymentProofImage ? {
        receiptImage: apiOrder.paymentProofImage,
        referenceNumber: apiOrder.paymentProofReference || '',
        senderName: apiOrder.paymentProofSender || '',
        paymentDate: apiOrder.paymentProofDate || '',
        notes: apiOrder.paymentProofNotes
      } : undefined,
      // ADD DIRECT PAYMENT PROOF FIELDS for easier access
      paymentProofImage: apiOrder.paymentProofImage || null,
      paymentProofReference: apiOrder.paymentProofReference || null,
      paymentProofSender: apiOrder.paymentProofSender || null,
      paymentProofDate: apiOrder.paymentProofDate || null,
      paymentProofNotes: apiOrder.paymentProofNotes || null,
      approvedBy: apiOrder.approvedBy,
      approvedAt: apiOrder.approvedAt,
      rejectedBy: apiOrder.rejectedBy,
      rejectionReason: apiOrder.rejectionReason,
      notes: apiOrder.notes,
      createdAt: apiOrder.createdAt,
      updatedAt: apiOrder.updatedAt
    };
    
    return convertedOrder;
  }

  // Get orders for current user
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const response = await api.get(`${this.baseUrl}/my-orders`);
      
      let ordersData: any[] = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      }
      
      // Convert each API order to frontend Order type
      const convertedOrders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      
      // Log summary of items found
      const totalItems = convertedOrders.reduce((sum, order) => sum + order.items.length, 0);
      
      return convertedOrders;
    } catch (error: any) {
      console.error('❌ Error fetching user orders:', error.response?.data || error.message);
      return [];
    }
  }

  async updateOrderPayment(id: number, status: string, details?: any): Promise<Order> {
  try {
    // Format the payload to match backend expectations (PascalCase)
    const payload: any = { 
      status: status 
    };
    
    if (details) {
      payload.details = {
        ApprovedBy: details.approvedBy || details.ApprovedBy,
        ApprovedAt: details.approvedAt || details.ApprovedAt || new Date().toISOString(),
        ApprovedById: details.approvedById || details.ApprovedById,
        Notes: details.notes || details.Notes,
        RejectedBy: details.rejectedBy || details.RejectedBy,
        RejectedAt: details.rejectedAt || details.RejectedAt,
        Reason: details.reason || details.Reason,
        Amount: details.amount || details.Amount
      };
    }
    

    
    const response = await api.put(`${this.baseUrl}/admin/${id}/payment`, payload);
    
    // Handle both response formats (with or without nested 'order' property)
    const orderData = response.data.order || response.data;
    return this.convertApiOrderToOrder(orderData);
  } catch (error: any) {
    console.error('❌ Error updating payment:', error.response?.data || error.message);
    throw error;
  }
}

  async createOrder(orderData: any): Promise<Order> {
    try {
      const response = await api.post(this.baseUrl, orderData);
      const convertedOrder = this.convertApiOrderToOrder(response.data);
      return convertedOrder;
    } catch (error: any) {
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
      const response = await api.get(`${this.baseUrl}/my-orders`, {
        params: { page, limit }
      });
      
      let ordersData: any[] = [];
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
      
      // Log items summary
      const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
      
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

  
  // Get all orders (admin only)
  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await api.get(`${this.baseUrl}/admin/all`);
      let ordersData: any[] = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      }

      
      // Convert each API order to frontend Order type
      const convertedOrders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      
      // Log summary
      const totalItems = convertedOrders.reduce((sum, order) => sum + order.items.length, 0);
      
      
      // Log payment proof info for debugging
      const ordersWithPaymentProof = convertedOrders.filter(o => o.paymentProofImage);
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