// src/services/product.service.ts
import api from '../api/config';
import { Product, Category } from '../types';

class ProductService {
  private readonly baseUrl = '/products/simple'; // Fix: Use correct route

  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      console.log('📤 Fetching products from /products/simple...');
      const response = await api.get('/products/simple');
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
      console.log(`📤 Fetching product ${id} from /products/simple...`);
      const response = await api.get(`/products/simple/${id}`);
      console.log('✅ Product fetched:', response.data);
      return response.data || null;
    } catch (error: any) {
      console.error(`❌ Error fetching product ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Create product - FIXED: Use PascalCase field names
  async createProduct(productData: any): Promise<Product> {
    try {
      // Convert camelCase to PascalCase for backend
      const backendData = {
        Name: productData.name,
        Description: productData.description,
        Price: productData.price,
        StockQuantity: productData.stockQuantity,
        CategoryId: productData.categoryId,
        ImageUrl: productData.imageUrl,
        Images: productData.images || [],
        Height: productData.height || 0,
        Width: productData.width || 0,
        Length: productData.length || 0,
        ColorsVariant: productData.colorsVariant || [],
        IsActive: productData.isActive
      };
      
      console.log('📤 Creating product with /products/simple...', JSON.stringify(backendData, null, 2));
      const response = await api.post('/products/simple', backendData);
      console.log('✅ Product created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating product:', error.response?.data);
      
      // Log validation errors in detail
      if (error.response?.data?.errors) {
        console.error('📋 Validation Errors:');
        const errors = error.response.data.errors;
        for (const [field, messages] of Object.entries(errors)) {
          console.error(`   - ${field}: ${(messages as string[]).join(', ')}`);
        }
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        throw new Error(`Validation failed:\n${errorMessages}`);
      }
      
      throw new Error(error.response?.data?.message || error.response?.data?.title || 'Failed to create product');
    }
  }

  // Update product - FIXED: Use PascalCase field names
  async updateProduct(id: number, productData: any): Promise<Product> {
    try {
      // Convert camelCase to PascalCase for backend
      const backendData = {
        Name: productData.name,
        Description: productData.description,
        Price: productData.price,
        StockQuantity: productData.stockQuantity,
        CategoryId: productData.categoryId,
        ImageUrl: productData.imageUrl,
        Images: productData.images || [],
        Height: productData.height || 0,
        Width: productData.width || 0,
        Length: productData.length || 0,
        ColorsVariant: productData.colorsVariant || [],
        IsActive: productData.isActive
      };
      
      console.log(`📤 Updating product ${id} with /products/simple...`, JSON.stringify(backendData, null, 2));
      const response = await api.put(`/products/simple/${id}`, backendData);
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
      console.log(`📤 Deleting product ${id} from /products/simple...`);
      await api.delete(`/products/simple/${id}`);
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
      const response = await api.patch(`/products/simple/${id}/toggle-status`, isActive);
      console.log('✅ Product status toggled:', response.data);
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