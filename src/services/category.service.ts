import api from '../api/config';

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

class CategoryService {
  private readonly baseUrl = '/categories';

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
}

const categoryService = new CategoryService();
export default categoryService;