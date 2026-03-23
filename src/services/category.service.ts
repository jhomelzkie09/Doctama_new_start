import api from '../api/config';

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
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
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching category ${id}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Create a new category (Admin only)
  async createCategory(categoryData: { name: string; description?: string }): Promise<Category> {
    try {
      console.log('📤 Creating category...', categoryData);
      const response = await api.post(this.baseUrl, categoryData);
      console.log('✅ Category created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating category:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  }

  // Update a category (Admin only)
  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category> {
    try {
      console.log(`📤 Updating category ${id}...`, categoryData);
      const response = await api.put(`${this.baseUrl}/${id}`, categoryData);
      console.log('✅ Category updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating category ${id}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  }

  // Delete a category (Admin only)
  async deleteCategory(id: number): Promise<void> {
    try {
      console.log(`📤 Deleting category ${id}...`);
      await api.delete(`${this.baseUrl}/${id}`);
      console.log('✅ Category deleted');
    } catch (error: any) {
      console.error(`❌ Error deleting category ${id}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  }
}

const categoryService = new CategoryService();
export default categoryService;