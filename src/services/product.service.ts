import api from '../api/config';
import { Product, Category, ApiResponse } from '../types';

class ProductService {
  async getProducts(): Promise<Product[]> {
    try {
      const response = await api.get<ApiResponse<Product[]>>('/products');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<ApiResponse<Category[]>>('/categories');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return []; // Return empty array for now
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await api.get<ApiResponse<Product[]>>(`/products/search?q=${query}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}

const productService = new ProductService();
export default productService;