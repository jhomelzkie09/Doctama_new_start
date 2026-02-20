import api from '../api/config';
import { Product, Category } from '../types';

class ProductService {
  private readonly baseUrl = '/simpleproducts'; // Changed from '/products'

  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      console.log('📤 Fetching products from /simpleproducts...');
      const response = await api.get('/simpleproducts');
      console.log('✅ Products fetched:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        return response.data.products;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching products:', error.response?.data || error.message);
      return [];
    }
  }

  // Get single product
  async getProductById(id: number): Promise<Product | null> {
    try {
      console.log(`📤 Fetching product ${id} from /simpleproducts...`);
      const response = await api.get(`/simpleproducts/${id}`);
      console.log('✅ Product fetched:', response.data);
      return response.data || null;
    } catch (error: any) {
      console.error(`❌ Error fetching product ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Add images to an existing product
  async addProductImages(productId: number, imageUrls: string[]): Promise<Product> {
    try {
      console.log(`📤 Adding images to product ${productId}...`, imageUrls);
      const response = await api.post(`/simpleproducts/${productId}/images`, { imageUrls });
      console.log('✅ Images added:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding images:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create product with JSON
  async createProduct(productData: any): Promise<Product> {
    try {
      console.log('📤 Creating product with /simpleproducts...', productData);
      const response = await api.post('/simpleproducts', productData);
      console.log('✅ Product created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating product:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create product');
    }
  }

  // Update product with JSON
  async updateProduct(id: number, productData: any): Promise<Product> {
    try {
      console.log(`📤 Updating product ${id} with /simpleproducts...`, productData);
      const response = await api.put(`/simpleproducts/${id}`, productData);
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
      console.log(`📤 Deleting product ${id} from /simpleproducts...`);
      await api.delete(`/simpleproducts/${id}`);
      console.log(`✅ Product ${id} deleted`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error deleting product ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Toggle product status
  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    try {
      console.log(`📤 Toggling product ${id} status to ${isActive ? 'active' : 'inactive'}...`);
      const endpoint = isActive ? 'activate' : 'deactivate';
      const response = await api.put(`/simpleproducts/${id}/${endpoint}`, { isActive });
      console.log('✅ Product status toggled:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error toggling product status:`, error);
      throw error;
    }
  }

  // Get categories (this stays the same as it's a different controller)
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