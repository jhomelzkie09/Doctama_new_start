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

    // ✅ FIXED: Keep original case for status fields
    const rawStatus = apiOrder.status || apiOrder.Status || 'Pending';
    const rawPaymentStatus = apiOrder.paymentStatus || apiOrder.PaymentStatus || 'Pending';
    const rawPaymentMethod = apiOrder.paymentMethod || apiOrder.PaymentMethod || 'cod';

    const convertedOrder: Order = {
      id: apiOrder.id?.toString() || '',
      orderNumber: apiOrder.orderNumber || apiOrder.OrderNumber || '',
      userId: apiOrder.userId || '',
      orderDate: apiOrder.orderDate || apiOrder.OrderDate || new Date().toISOString(),
      totalAmount: apiOrder.totalAmount || apiOrder.TotalAmount || 0,
      status: rawStatus, // ✅ Keep original case
      paymentStatus: rawPaymentStatus, // ✅ Keep original case
      paymentMethod: rawPaymentMethod, // ✅ Keep original case
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
    
    console.log('🔄 Converted order:', {
      id: convertedOrder.id,
      orderNumber: convertedOrder.orderNumber,
      status: convertedOrder.status,
      paymentStatus: convertedOrder.paymentStatus,
      paymentMethod: convertedOrder.paymentMethod
    });
    
    return convertedOrder;
  }

  async getOrderById(id: number): Promise<Order | null> {
    try {
      const response = await api.get(`${this.baseUrl}/my-orders/${id}`);
      const apiOrder = response.data;
      const order = this.convertApiOrderToOrder(apiOrder);
      return order;
    } catch (error: any) {
      console.error(`❌ Error fetching order ${id}:`, error.response?.data || error.message);
      return null;
    }
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
      
      const convertedOrders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      return convertedOrders;
    } catch (error: any) {
      console.error('❌ Error fetching user orders:', error.response?.data || error.message);
      return [];
    }
  }

  // Update the updateOrderPayment method
async updateOrderPayment(id: number, status: string, details?: any): Promise<Order> {
  try {
    const payload: any = { 
      paymentStatus: status,
      status: status
    };
    
    if (details) {
      // Payment proof fields
      if (details.paymentProofImage) {
        payload.paymentProofImage = details.paymentProofImage;
      }
      if (details.paymentProofReference) {
        payload.paymentProofReference = details.paymentProofReference;
      }
      if (details.paymentProofSender) {
        payload.paymentProofSender = details.paymentProofSender;
      }
      if (details.paymentProofDate) {
        payload.paymentProofDate = details.paymentProofDate;
      }
      if (details.paymentProofNotes) {
        payload.paymentProofNotes = details.paymentProofNotes;
      }
      
      // Admin approval fields (only used by admin)
      if (details.approvedBy) {
        payload.approvedBy = details.approvedBy;
      }
      if (details.approvedAt) {
        payload.approvedAt = details.approvedAt;
      }
      if (details.rejectedBy) {
        payload.rejectedBy = details.rejectedBy;
      }
      if (details.rejectionReason || details.reason) {
        payload.rejectionReason = details.rejectionReason || details.reason;
      }
      if (details.notes) {
        payload.notes = details.notes;
      }
    }
    
    console.log('📤 Updating order payment:', { id, payload });
    
    // ✅ Determine which endpoint to use
    const isAdminAction = details?.approvedBy || details?.rejectedBy || 
                          status === 'paid' || status === 'failed' || status === 'cancelled';
    
    let response;
    if (isAdminAction) {
      // Admin actions use the admin endpoint
      console.log('   Using admin endpoint');
      response = await api.put(`${this.baseUrl}/admin/${id}/payment`, payload);
    } else {
      // Customer upload uses the upload-payment-proof endpoint
      console.log('   Using customer upload endpoint');
      response = await api.put(`${this.baseUrl}/${id}/upload-payment-proof`, payload);
    }
    
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
      
      const convertedOrders = ordersData.map(apiOrder => this.convertApiOrderToOrder(apiOrder));
      
      console.log('📦 Admin orders loaded:', {
        count: convertedOrders.length,
        sample: convertedOrders.slice(0, 2).map(o => ({
          id: o.id,
          status: o.status,
          paymentStatus: o.paymentStatus
        }))
      });
      
      return convertedOrders;
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error.response?.data || error.message);
      return [];
    }
  }

  // Add this method to the OrderService class
async cancelOrder(id: number): Promise<Order> {
  try {
    console.log(`📤 Cancelling order ${id}`);
    const response = await api.put(`${this.baseUrl}/${id}/cancel`);
    
    const orderData = response.data.order || response.data;
    return this.convertApiOrderToOrder(orderData);
  } catch (error: any) {
    console.error('❌ Error cancelling order:', error.response?.data || error.message);
    throw error;
  }
}

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    try {
      const response = await api.put(`${this.baseUrl}/admin/${id}/status`, { status });
      return this.convertApiOrderToOrder(response.data);
    } catch (error: any) {
      console.error('❌ Error updating order:', error.response?.data || error.message);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService;