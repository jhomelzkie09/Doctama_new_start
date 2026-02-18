import api from '../api/config';

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  imageUrl?: string;
}

class CategoryService {
  private readonly baseUrl = '/categories';

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      console.log('📤 Fetching categories...');
      const response = await api.get(this.baseUrl);
      console.log('✅ Categories fetched:', response.data);
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data.categories && Array.isArray(response.data.categories)) {
        return response.data.categories;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error.response?.data || error.message);
      return [];
    }
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<Category | null> {
    try {
      console.log(`📤 Fetching category ${id}...`);
      const response = await api.get(`${this.baseUrl}/${id}`);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error: any) {
      console.error(`❌ Error fetching category ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Create category (Admin only)
  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      console.log('📤 Creating category...', data);
      const response = await api.post(`${this.baseUrl}/admin/categories`, data);
      console.log('✅ Category created:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('❌ Error creating category:', error.response?.data || error.message);
      throw error;
    }
  }

  // Update category (Admin only)
  async updateCategory(id: number, data: Partial<CreateCategoryData>): Promise<Category> {
    try {
      console.log(`📤 Updating category ${id}...`, data);
      const response = await api.put(`${this.baseUrl}/admin/categories/${id}`, data);
      console.log('✅ Category updated:', response.data);
      
      if (response.data) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`❌ Error updating category ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Delete category (Admin only)
  async deleteCategory(id: number): Promise<boolean> {
    try {
      console.log(`📤 Deleting category ${id}...`);
      await api.delete(`${this.baseUrl}/admin/categories/${id}`);
      console.log(`✅ Category ${id} deleted`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error deleting category ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

const categoryService = new CategoryService();
export default categoryService;