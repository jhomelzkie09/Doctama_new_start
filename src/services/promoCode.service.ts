import api from '../api/config';
import { PromoCode } from '../types';

class PromoCodeService {
  private readonly baseUrl = '/promo-codes';

  // Get all promo codes (admin)
  async getAllPromoCodes(): Promise<PromoCode[]> {
    try {
      const response = await api.get(`${this.baseUrl}/admin/all`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      return [];
    }
  }

  // Get active promo codes (public)
  async getActivePromoCodes(): Promise<PromoCode[]> {
    try {
      const response = await api.get(`${this.baseUrl}/active`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active promo codes:', error);
      return [];
    }
  }

  // Get single promo code by ID
  async getPromoCodeById(id: string): Promise<PromoCode | null> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching promo code:', error);
      return null;
    }
  }

  // Create promo code (admin)
  async createPromoCode(data: Omit<PromoCode, 'id' | 'createdAt' | 'usageCount'>): Promise<PromoCode> {
    try {
      const response = await api.post(`${this.baseUrl}/admin`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      throw error;
    }
  }

  // Update promo code (admin)
  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
    try {
      const response = await api.put(`${this.baseUrl}/admin/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      throw error;
    }
  }

  // Delete promo code (admin)
  async deletePromoCode(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/admin/${id}`);
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      throw error;
    }
  }

  // Validate promo code (public)
  async validatePromoCode(code: string, cartTotal: number, userId?: string): Promise<{
    isValid: boolean;
    message?: string;
    discountAmount?: number;
    promoCode?: PromoCode;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/validate`, {
        code,
        cartTotal,
        userId
      });
      return response.data;
    } catch (error: any) {
      return {
        isValid: false,
        message: error.response?.data?.message || 'Invalid promo code'
      };
    }
  }

  // Apply promo code to cart
  async applyPromoCode(code: string, cartTotal: number, userId?: string): Promise<{
    success: boolean;
    message: string;
    discountAmount?: number;
    newTotal?: number;
  }> {
    try {
      const validation = await this.validatePromoCode(code, cartTotal, userId);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message || 'Invalid promo code'
        };
      }

      return {
        success: true,
        message: 'Promo code applied successfully!',
        discountAmount: validation.discountAmount,
        newTotal: cartTotal - (validation.discountAmount || 0)
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to apply promo code'
      };
    }
  }
}

const promoCodeService = new PromoCodeService();
export default promoCodeService;