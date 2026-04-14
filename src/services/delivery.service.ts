import api from '../api/config';

export interface DeliveryItem {
  productId: number;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'received' | 'partial';
  notes?: string;
}

export interface DeliveryOrder {
  id: number;
  deliveryNumber: string;
  purchaseOrderNumber: string;
  supplierName: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  deliveryDate: string;
  expectedDate: string;
  status: 'pending' | 'received' | 'cancelled' | 'partial';
  notes?: string;
  trackingNumber?: string;
  receivedBy?: string;
  receivedAt?: string;
  totalItems: number;
  totalQuantity: number;
  items: DeliveryItem[];
}

export interface DeliveryStats {
  pendingDeliveries: number;
  receivedThisMonth: number;
  totalItemsReceived: number;
  totalValue: number;
  totalDeliveries: number;
  averageOrderValue: number;
}

class DeliveryService {
  private readonly baseUrl = '/delivery';

  // Get all deliveries
  async getAllDeliveries(): Promise<DeliveryOrder[]> {
    try {
      const response = await api.get(this.baseUrl);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      throw error;
    }
  }

  // Get delivery by ID
  async getDeliveryById(id: number): Promise<DeliveryOrder> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching delivery:', error);
      throw error;
    }
  }

  // Create delivery order
  async createDelivery(deliveryData: any): Promise<DeliveryOrder> {
    try {
      const response = await api.post(this.baseUrl, deliveryData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      throw error;
    }
  }

  // Receive delivery (update stock)
  async receiveDelivery(id: number, items: { productId: number; receivedQuantity: number }[]): Promise<any> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/receive`, { items });
      return response.data;
    } catch (error: any) {
      console.error('Error receiving delivery:', error);
      throw error;
    }
  }

  // Update delivery
  async updateDelivery(id: number, deliveryData: any): Promise<DeliveryOrder> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, deliveryData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating delivery:', error);
      throw error;
    }
  }

  // Cancel delivery
  async cancelDelivery(id: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}/cancel`);
    } catch (error: any) {
      console.error('Error cancelling delivery:', error);
      throw error;
    }
  }

  // Get delivery stats
  async getDeliveryStats(): Promise<DeliveryStats> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching delivery stats:', error);
      throw error;
    }
  }

  // Get product delivery history
  async getProductDeliveryHistory(productId: number): Promise<any[]> {
    try {
      const response = await api.get(`${this.baseUrl}/product/${productId}/history`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching product delivery history:', error);
      throw error;
    }
  }
}

export default new DeliveryService();