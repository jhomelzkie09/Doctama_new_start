import api from '../api/config';

class UploadService {
  private readonly baseUrl = '/products';

  // Upload multiple images and return URLs
  async uploadImages(files: File[]): Promise<string[]> {
    try {
      console.log('📤 Uploading images...', files.length);
      
      const formData = new FormData();
      
      // Your backend expects the files with key 'files'
      files.forEach(file => {
        formData.append('files', file);
      });

      // FIX: Change from '/upload' to '/upload-images' to match your backend
      const response = await api.post(`${this.baseUrl}/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Images uploaded:', response.data);
      
      // Handle the response format from your controller
      if (response.data.urls) {
        return response.data.urls;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.imageUrls) {
        return response.data.imageUrls;
      }
      
      return [];
      
    } catch (error: any) {
      console.error('❌ Error uploading images:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to upload images');
    }
  }

  // Upload single image
  async uploadImage(file: File): Promise<string> {
    const urls = await this.uploadImages([file]);
    return urls[0];
  }

  // Clean up object URLs to prevent memory leaks
  revokeImageUrl(url: string) {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  revokeImageUrls(urls: string[]) {
    urls.forEach(url => this.revokeImageUrl(url));
  }
}

const uploadService = new UploadService();
export default uploadService;