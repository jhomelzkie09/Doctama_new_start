import api from '../api/config';
import { API_URL } from '../api/config';
import axios from 'axios';
import { Product, Category, ApiResponse } from '../types';

class ProductService {
  baseUrl: any;
  toggleProductStatus(id: number, arg1: boolean) {
      throw new Error('Method not implemented.');
  }
  // Default getProducts method (no pagination)
  async getProducts(): Promise<Product[]> {
    try {
      const response = await api.get<ApiResponse<Product[]>>('/products');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get products with pagination (optional method)
  async getProductsPaginated(page?: number, limit?: number): Promise<{
    products: Product[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const params: any = {};
      if (page) params.page = page;
      if (limit) params.limit = limit;
      
      const response = await axios.get(`${API_URL}/products`, {
        params,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
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

  async deleteProduct(id: number): Promise<boolean> {
  try {
    console.log(`📤 Deleting product ${id}...`);
    await api.delete(`${this.baseUrl}/admin/products/${id}`);
    console.log(`✅ Product ${id} deleted`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error deleting product ${id}:`, error.response?.data || error.message);
    throw error;
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