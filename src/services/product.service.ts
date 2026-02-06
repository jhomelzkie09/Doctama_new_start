import api from '../api/config';
import { Product, Category, ApiResponse } from '../types';

class ProductService {
  async getProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/products');
    return response.data?.data || [];
  }

  async getProduct(id: number): Promise<Product | null> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data?.data || null;
  }

  async getCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data?.data || [];
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(`/products/search?q=${query}`);
    return response.data?.data || [];
  }
}

const productService = new ProductService();
export default productService;