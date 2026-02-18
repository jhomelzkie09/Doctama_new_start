import api from '../api/config';
import { API_URL } from '../api/config';
import axios from 'axios';
import { Product, Category, ApiResponse } from '../types';

class ProductService {
  private readonly baseUrl = '/products';

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

  // Get single product by ID
  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // Alias for getProduct (to match the method name used in ProductForm)
  async getProductById(id: number): Promise<Product | null> {
    return this.getProduct(id);
  }

  // Create new product (Admin only)
  async createProduct(productData: any): Promise<Product> {
    try {
      console.log('📤 Creating product...', productData);
      const response = await api.post(`${this.baseUrl}/admin/products`, productData);
      console.log('✅ Product created:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('❌ Error creating product:', error.response?.data || error.message);
      throw error;
    }
  }

  // Update product (Admin only)
  async updateProduct(id: number, productData: any): Promise<Product> {
    try {
      console.log(`📤 Updating product ${id}...`, productData);
      const response = await api.put(`${this.baseUrl}/admin/products/${id}`, productData);
      console.log('✅ Product updated:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`❌ Error updating product ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Delete product (Admin only)
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

  // Toggle product status (Admin only)
  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    try {
      console.log(`📤 Toggling product ${id} status to ${isActive ? 'active' : 'inactive'}...`);
      const response = await api.patch(`${this.baseUrl}/admin/products/${id}/status`, { isActive });
      console.log('✅ Product status toggled:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`❌ Error toggling product status ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Upload product image
  async uploadProductImage(file: File): Promise<string> {
    try {
      console.log('📤 Uploading product image...');
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post(`${this.baseUrl}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Image uploaded:', response.data);
      
      if (response.data.imageUrl) {
        return response.data.imageUrl;
      } else if (response.data.url) {
        return response.data.url;
      }
      
      throw new Error('No image URL in response');
    } catch (error: any) {
      console.error('❌ Error uploading image:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<ApiResponse<Category[]>>('/categories');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return []; // Return empty array for now
    }
  }

  // Search products
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