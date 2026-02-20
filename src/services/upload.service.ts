import api from '../api/config';

class UploadService {
  private readonly baseUrl = '/products';

  async uploadImages(files: File[]): Promise<string[]> {
    try {
      console.log('📤 Uploading images...', files.length);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post(`${this.baseUrl}/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Upload response:', response.data);
      
      // Handle different response formats
      if (response.data.urls && Array.isArray(response.data.urls)) {
        return response.data.urls;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.imageUrls && Array.isArray(response.data.imageUrls)) {
        return response.data.imageUrls;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // If response is an object with a single URL
      if (response.data.url) {
        return [response.data.url];
      }
      
      console.warn('⚠️ Unexpected response format:', response.data);
      return [];
      
    } catch (error: any) {
      console.error('❌ Error uploading images:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to upload images');
    }
  }

  async uploadImage(file: File): Promise<string> {
    const urls = await this.uploadImages([file]);
    return urls[0] || '';
  }

  revokeImageUrl(url: string) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  revokeImageUrls(urls: string[]) {
    if (Array.isArray(urls)) {
      urls.forEach(url => this.revokeImageUrl(url));
    }
  }
}

const uploadService = new UploadService();
export default uploadService;