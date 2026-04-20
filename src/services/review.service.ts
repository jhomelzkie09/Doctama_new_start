import api from '../api/config';
import { ProductReview, CreateReviewData, ReviewStats } from '../types';

class ReviewService {
  private readonly baseUrl = '/reviews';

  // Get reviews for a product
  async getProductReviews(productId: number): Promise<ProductReview[]> {
    try {
      const response = await api.get(`${this.baseUrl}/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      return [];
    }
  }

  // Get review stats for a product
  async getReviewStats(productId: number): Promise<ReviewStats> {
    try {
      const response = await api.get(`${this.baseUrl}/product/${productId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0]
      };
    }
  }

  // Check if user can review a product
  async canReviewProduct(productId: number): Promise<{ canReview: boolean; reason?: string; message?: string }> {
    try {
      const response = await api.get(`${this.baseUrl}/can-review/${productId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to check review eligibility:', error);
      return { canReview: false, reason: 'error', message: 'Unable to check eligibility' };
    }
  }

  // Create a review
  async createReview(data: CreateReviewData): Promise<ProductReview> {
    try {
      const payload: any = {
        productId: data.productId,
        rating: data.rating,
        comment: data.comment
      };

      if (data.title?.trim()) {
        payload.title = data.title.trim();
      }
      if (data.images && data.images.length > 0) {
        payload.images = data.images;
      }
      if (data.orderId) {
        payload.orderId = data.orderId;
      }

      const response = await api.post(this.baseUrl, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(id: number, data: Partial<CreateReviewData>): Promise<ProductReview> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(id: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  }

  // Mark review as helpful
  async markHelpful(id: number): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/${id}/helpful`);
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
    }
  }
}

export default new ReviewService();