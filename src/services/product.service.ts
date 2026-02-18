import api from '../api/config';
import { API_URL } from '../api/config';
import axios from 'axios';
import { Product, Category, ApiResponse } from '../types';

class ProductService {
  private readonly baseUrl = '/products';

  // Default getProducts method (no pagination)
  async getProducts(): Promise<Product[]> {
  try {
    console.log('📤 Fetching products...');
    const response = await api.get('/products');
    console.log('📦 Raw API Response:', response.data);
    
    // Handle different response formats
    let products: Product[] = [];
    
    if (Array.isArray(response.data)) {
      // Direct array response
      products = response.data;
      console.log('✅ Products fetched (direct array):', products.length);
    } 
    else if (response.data.data && Array.isArray(response.data.data)) {
      // Wrapped in data property
      products = response.data.data;
      console.log('✅ Products fetched (data property):', products.length);
    }
    else if (response.data.products && Array.isArray(response.data.products)) {
      // Wrapped in products property
      products = response.data.products;
      console.log('✅ Products fetched (products property):', products.length);
    }
    else if (response.data && typeof response.data === 'object') {
      // Check if it's a single product wrapped in an object
      console.log('⚠️ Unexpected format, checking for single product...');
      
      // If it has an id, it might be a single product
      if (response.data.id) {
        products = [response.data];
        console.log('✅ Single product found');
      }
    }
    
    // Log the first product to see its structure
    if (products.length > 0) {
      console.log('📦 First product structure:', products[0]);
    } else {
      console.log('📦 No products found');
    }
    
    return products;
  } catch (error: any) {
    console.error('❌ Error fetching products:', error.response?.data || error.message);
    return [];
  }
}

  // Get products with pagination
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

  // Alias for getProduct
  async getProductById(id: number): Promise<Product | null> {
    return this.getProduct(id);
  }

  // Create new product - FIXED ENDPOINT
  async createProduct(productData: any): Promise<Product> {
    try {
      console.log('📤 Creating product...', productData);
      // Try without /admin first since CategoriesController doesn't use it
      const response = await api.post(`/products`, productData);
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

  // Update product - FIXED ENDPOINT
  async updateProduct(id: number, productData: any): Promise<Product> {
    try {
      console.log(`📤 Updating product ${id}...`, productData);
      const response = await api.put(`/products/${id}`, productData);
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

  // Delete product - FIXED ENDPOINT
  async deleteProduct(id: number): Promise<boolean> {
    try {
      console.log(`📤 Deleting product ${id}...`);
      await api.delete(`/products/${id}`);
      console.log(`✅ Product ${id} deleted`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error deleting product ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Toggle product status - May need adjustment based on your backend
  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    try {
      console.log(`📤 Toggling product ${id} status to ${isActive ? 'active' : 'inactive'}...`);
      // Try PATCH or PUT based on your backend
      const response = await api.patch(`/products/${id}/status`, { isActive });
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

  // Upload product image - You may need a different endpoint
  async uploadProductImage(file: File): Promise<string> {
    // Temporary solution - just return a data URL for preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  // Get categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<ApiResponse<Category[]>>('/categories');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
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