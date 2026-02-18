import api from '../api/config';
import { Product, Category, CreateProductData } from '../types';

class ProductService {
  private readonly baseUrl = '/products';

  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      console.log('📤 Fetching products...');
      const response = await api.get('/products');
      
      let products: Product[] = [];
      
      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Get single product by ID
  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // Alias for getProduct
  async getProductById(id: number): Promise<Product | null> {
    return this.getProduct(id);
  }

  // Upload multiple images
  async uploadProductImages(files: File[]): Promise<string[]> {
    try {
      console.log('📤 Uploading product images...', files.length);
      
      // If your backend doesn't support multiple upload yet, use this workaround
      const imageUrls: string[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
          // Try API upload first
          const response = await api.post('/products/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (response.data.imageUrl) {
            imageUrls.push(response.data.imageUrl);
          } else if (response.data.url) {
            imageUrls.push(response.data.url);
          }
        } catch (error) {
          // Fallback to data URL for development
          const dataUrl = await this.fileToDataUrl(file);
          imageUrls.push(dataUrl);
        }
      }
      
      return imageUrls;
    } catch (error: any) {
      console.error('❌ Error uploading images:', error);
      throw error;
    }
  }

  // Helper to convert file to data URL
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Create new product with multiple images
  async createProduct(productData: CreateProductData): Promise<Product> {
    try {
      console.log('📤 Creating product...', productData);
      const response = await api.post('/products', productData);
      console.log('✅ Product created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating product:', error.response?.data || error.message);
      throw error;
    }
  }

  // Update product
  async updateProduct(id: number, productData: Partial<CreateProductData>): Promise<Product> {
    try {
      console.log(`📤 Updating product ${id}...`, productData);
      const response = await api.put(`/products/${id}`, productData);
      console.log('✅ Product updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating product ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Delete product
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

  // Toggle product status
  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    try {
      console.log(`📤 Toggling product ${id} status...`);
      const response = await api.patch(`/products/${id}/status`, { isActive });
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

const productService = new ProductService();
export default productService;