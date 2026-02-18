import api from '../api/config';

class UploadService {
  private readonly baseUrl = '/products'; // Changed from '/upload' to '/products'

  // Upload multiple images and return URLs
  async uploadImages(files: File[]): Promise<string[]> {
    try {
      console.log('📤 Uploading images...', files.length);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file); // Backend expects 'files' field
      });

      // Use your backend's product upload endpoint
      const response = await api.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Images uploaded:', response.data);
      
      // Handle different response formats
      if (response.data.imageUrls) {
        return response.data.imageUrls;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.urls) {
        return response.data.urls;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // If response contains the product with images
      if (response.data.images) {
        return response.data.images.map((img: any) => img.imageUrl);
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