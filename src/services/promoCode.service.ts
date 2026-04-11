import api from '../api/config';
import { PromoCode } from '../types';

// Mock data for development until backend is ready
const MOCK_PROMO_CODES: PromoCode[] = [
  {
    id: 1,
    code: 'WELCOME10',
    description: '10% off on your first order',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrderAmount: 500,
    maxDiscountAmount: 500,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 100,
    usageCount: 0,
    perUserLimit: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    code: 'FREESHIP',
    description: 'Free shipping on orders over ₱1,000',
    discountType: 'fixed',
    discountValue: 150,
    minimumOrderAmount: 1000,
    maxDiscountAmount: 150,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 50,
    usageCount: 0,
    perUserLimit: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    code: 'SUMMER20',
    description: '20% off summer collection',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrderAmount: 1000,
    maxDiscountAmount: 1000,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 200,
    usageCount: 0,
    perUserLimit: 2,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

class PromoCodeService {
  private readonly baseUrl = '/promo-codes';
  private useMockData = true; // Set to false when backend is ready

  // Get all promo codes (admin)
  async getAllPromoCodes(): Promise<PromoCode[]> {
    if (this.useMockData) {
      return MOCK_PROMO_CODES;
    }

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
    if (this.useMockData) {
      const now = new Date();
      return MOCK_PROMO_CODES.filter(p => 
        p.isActive && 
        new Date(p.startDate) <= now && 
        new Date(p.endDate) >= now
      );
    }

    try {
      const response = await api.get(`${this.baseUrl}/active`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active promo codes:', error);
      return [];
    }
  }

  // Get single promo code by ID
  async getPromoCodeById(id: number): Promise<PromoCode | null> {
    if (this.useMockData) {
      const promo = MOCK_PROMO_CODES.find(p => p.id === id);
      return promo || null;
    }

    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching promo code:', error);
      return null;
    }
  }

  // Create promo code (admin)
  async createPromoCode(data: any): Promise<PromoCode> {
    if (this.useMockData) {
      const newPromo: PromoCode = {
        id: MOCK_PROMO_CODES.length + 1,
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumOrderAmount: data.minimumOrderAmount || 0,
        maxDiscountAmount: data.maxDiscountAmount || 0,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        usageLimit: data.usageLimit || null,
        usageCount: 0,
        perUserLimit: data.perUserLimit || 1,
        isActive: data.isActive,
        createdAt: new Date().toISOString()
      };
      MOCK_PROMO_CODES.push(newPromo);
      return newPromo;
    }

    try {
      const response = await api.post(`${this.baseUrl}/admin`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      throw error;
    }
  }

  // Update promo code (admin)
  async updatePromoCode(id: number, data: Partial<PromoCode>): Promise<PromoCode> {
    if (this.useMockData) {
      const index = MOCK_PROMO_CODES.findIndex(p => p.id === id);
      if (index !== -1) {
        MOCK_PROMO_CODES[index] = { ...MOCK_PROMO_CODES[index], ...data };
        return MOCK_PROMO_CODES[index];
      }
      throw new Error('Promo code not found');
    }

    try {
      const response = await api.put(`${this.baseUrl}/admin/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      throw error;
    }
  }

  // Delete promo code (admin)
  async deletePromoCode(id: number): Promise<void> {
    if (this.useMockData) {
      const index = MOCK_PROMO_CODES.findIndex(p => p.id === id);
      if (index !== -1) {
        MOCK_PROMO_CODES.splice(index, 1);
      }
      return;
    }

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
    if (this.useMockData) {
      const promo = MOCK_PROMO_CODES.find(p => p.code === code.toUpperCase());
      
      if (!promo) {
        return { isValid: false, message: 'Invalid promo code' };
      }

      const now = new Date();
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);

      if (!promo.isActive) {
        return { isValid: false, message: 'This promo code is not active' };
      }

      if (now < startDate) {
        return { isValid: false, message: 'This promo code is not valid yet' };
      }

      if (now > endDate) {
        return { isValid: false, message: 'This promo code has expired' };
      }

      if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
        return { isValid: false, message: 'This promo code has reached its usage limit' };
      }

      if (cartTotal < (promo.minimumOrderAmount || 0)) {
        return { 
          isValid: false, 
          message: `Minimum order amount of ₱${(promo.minimumOrderAmount || 0).toLocaleString()} required` 
        };
      }

      let discountAmount = 0;
      if (promo.discountType === 'percentage') {
        discountAmount = cartTotal * (promo.discountValue / 100);
      } else {
        discountAmount = promo.discountValue;
      }

      if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }

      return {
        isValid: true,
        message: 'Promo code is valid',
        discountAmount,
        promoCode: promo
      };
    }

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
    if (this.useMockData) {
      const validation = await this.validatePromoCode(code, cartTotal, userId);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message || 'Invalid promo code'
        };
      }

      // Update usage count (in mock data)
      const promo = MOCK_PROMO_CODES.find(p => p.code === code.toUpperCase());
      if (promo) {
        promo.usageCount++;
      }

      return {
        success: true,
        message: 'Promo code applied successfully!',
        discountAmount: validation.discountAmount,
        newTotal: cartTotal - (validation.discountAmount || 0)
      };
    }

    try {
      const response = await api.post(`${this.baseUrl}/apply`, {
        code,
        cartTotal,
        userId
      });
      return response.data;
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