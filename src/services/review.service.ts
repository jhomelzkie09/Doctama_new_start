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

  // Create a review
  async createReview(data: CreateReviewData): Promise<ProductReview> {
    try {
      const response = await api.post(this.baseUrl, data);
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