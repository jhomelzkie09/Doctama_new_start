import api from '../api/config';
import { Product, Category } from '../types';

class ProductService {
  private readonly baseUrl = '/products/simple';

  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await api.get('/products/simple');    
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

  // ✅ NEW: Get products with pagination
  async getProductsPaginated(page: number = 1, pageSize: number = 12): Promise<Product[]> {
    try {
      const response = await api.get('/products/simple', {
        params: { page, pageSize }
      });
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        return response.data.products;
      } else if (response.data.items && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching paginated products:', error.response?.data || error.message);
      return [];
    }
  }

  // Get single product
  async getProductById(id: number): Promise<Product | null> {
    try {
      const response = await api.get(`/products/simple/${id}`);
      return response.data || null;
    } catch (error: any) {
      console.error(`❌ Error fetching product ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Check if product name already exists
  async checkProductNameExists(name: string, excludeId?: number): Promise<boolean> {
    try {
      const products = await this.getProducts();
      const normalizedName = name.trim().toLowerCase();
      return products.some(product => 
        product.name.trim().toLowerCase() === normalizedName && 
        (!excludeId || product.id !== excludeId)
      );
    } catch (error: any) {
      console.error('❌ Error checking product name:', error.response?.data || error.message);
      return false;
    }
  }

  // Create product
  async createProduct(productData: any): Promise<Product> {
    try {
      // Ensure images is an array of strings (not objects)
      let imagesArray: string[] = [];
      if (productData.images && Array.isArray(productData.images)) {
        imagesArray = productData.images
          .map((img: string | { imageUrl: string }) => 
            typeof img === 'string' ? img : img.imageUrl
          )
          .filter((url: string) => url && url.trim() !== '');
      }
      
      // Ensure colorsVariant is an array of strings
      let colorsArray: string[] = [];
      if (productData.colorsVariant && Array.isArray(productData.colorsVariant)) {
        colorsArray = productData.colorsVariant.filter((c: string) => c && c.trim() !== '');
      }
      
      const backendData = {
        Name: productData.name || '',
        Description: productData.description || '',
        Price: typeof productData.price === 'number' ? productData.price : parseFloat(productData.price) || 0,
        StockQuantity: typeof productData.stockQuantity === 'number' ? productData.stockQuantity : parseInt(productData.stockQuantity) || 0,
        CategoryId: typeof productData.categoryId === 'number' ? productData.categoryId : parseInt(productData.categoryId) || 0,
        ImageUrl: productData.imageUrl || '',
        Images: imagesArray,
        Height: typeof productData.height === 'number' ? productData.height : parseFloat(productData.height) || 0,
        Width: typeof productData.width === 'number' ? productData.width : parseFloat(productData.width) || 0,
        Length: typeof productData.length === 'number' ? productData.length : parseFloat(productData.length) || 0,
        ColorsVariant: colorsArray,
        IsActive: productData.isActive === true || productData.isActive === 'true' ? true : false
      };
      
      const response = await api.post('/products/simple', backendData);
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

  // Update product
  async updateProduct(id: number, productData: any): Promise<Product> {
    try {
      // Ensure images is an array of strings (not objects)
      let imagesArray: string[] = [];
      if (productData.images && Array.isArray(productData.images)) {
        imagesArray = productData.images
          .map((img: string | { imageUrl: string }) => 
            typeof img === 'string' ? img : img.imageUrl
          )
          .filter((url: string) => url && url.trim() !== '');
      }
      
      // Ensure colorsVariant is an array of strings
      let colorsArray: string[] = [];
      if (productData.colorsVariant && Array.isArray(productData.colorsVariant)) {
        colorsArray = productData.colorsVariant.filter((c: string) => c && c.trim() !== '');
      }
      
      // Auto-deactivate if stock becomes 0
      const shouldDeactivate = productData.stockQuantity === 0 && productData.isActive !== false;
      
      const backendData = {
        Name: productData.name || '',
        Description: productData.description || '',
        Price: typeof productData.price === 'number' ? productData.price : parseFloat(productData.price) || 0,
        StockQuantity: typeof productData.stockQuantity === 'number' ? productData.stockQuantity : parseInt(productData.stockQuantity) || 0,
        CategoryId: typeof productData.categoryId === 'number' ? productData.categoryId : parseInt(productData.categoryId) || 0,
        ImageUrl: productData.imageUrl || '',
        Images: imagesArray,
        Height: typeof productData.height === 'number' ? productData.height : parseFloat(productData.height) || 0,
        Width: typeof productData.width === 'number' ? productData.width : parseFloat(productData.width) || 0,
        Length: typeof productData.length === 'number' ? productData.length : parseFloat(productData.length) || 0,
        ColorsVariant: colorsArray,
        // Auto-deactivate if stock is 0, otherwise use the provided value
        IsActive: shouldDeactivate ? false : (productData.isActive === true || productData.isActive === 'true' ? true : false)
      };
      
      // If auto-deactivation happened, add a note in the console
      if (shouldDeactivate && (productData.isActive === true || productData.isActive === 'true')) {
        console.log(`🔄 Product ${id} has been automatically deactivated because stock quantity is 0.`);
      }
      
      const response = await api.put(`/products/simple/${id}`, backendData);
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

  // Update product stock only (useful for quick stock updates)
  async updateProductStock(id: number, stockQuantity: number, autoDeactivate: boolean = true): Promise<Product> {
    try {
      // First get the current product to check its active status
      const currentProduct = await this.getProductById(id);
      
      if (!currentProduct) {
        throw new Error('Product not found');
      }
      
      const updateData: any = { stockQuantity };
      
      // Auto-deactivate if stock becomes 0 and autoDeactivate is true
      if (autoDeactivate && stockQuantity === 0 && currentProduct.isActive) {
        updateData.isActive = false;
        console.log(`🔄 Product ${id} has been automatically deactivated because stock quantity is 0.`);
      }
      
      const response = await api.patch(`/products/simple/${id}/stock`, updateData);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating product stock ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Delete product
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await api.delete(`/products/simple/${id}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error deleting product ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Toggle product status
  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    try {
      const response = await api.patch(`/products/simple/${id}/toggle-status`, isActive);
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