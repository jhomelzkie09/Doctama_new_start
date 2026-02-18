import api from '../api/config';
import { Product, Category } from '../types';

class ProductService {
  private readonly baseUrl = '/products';

  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await api.get('/products');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Get single product
  async getProductById(id: number): Promise<Product | null> {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // Create product with JSON
  async createProduct(productData: any): Promise<Product> {
    try {
      console.log('📤 Creating product with JSON...', productData);
      const response = await api.post('/products', productData);
      console.log('✅ Product created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating product:', error.response?.data);
      
      // Extract validation error messages
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.title || 
        'Failed to create product'
      );
    }
  }

  // Update product with JSON
  async updateProduct(id: number, productData: any): Promise<Product> {
    try {
      console.log(`📤 Updating product ${id} with JSON...`, productData);
      const response = await api.put(`/products/${id}`, productData);
      console.log('✅ Product updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating product ${id}:`, error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.title || 
        'Failed to update product'
      );
    }
  }

  // Delete product
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await api.delete(`/products/${id}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error deleting product:`, error);
      throw error;
    }
  }

  // Toggle product status
  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    try {
      const endpoint = isActive ? 'activate' : 'deactivate';
      const response = await api.put(`/products/${id}/${endpoint}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error toggling product status:`, error);
      throw error;
    }
  }

  // Get categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get('/categories');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
}

export default new ProductService();