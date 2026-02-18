import api from '../api/config';

class UploadService {
  private readonly baseUrl = '/upload';

  // Upload multiple images and return URLs
  async uploadImages(files: File[]): Promise<string[]> {
    try {
      console.log('📤 Uploading images...', files.length);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Try your backend upload endpoint first
      try {
        const response = await api.post(`${this.baseUrl}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Handle different response formats
        if (response.data.urls) {
          return response.data.urls;
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data.imageUrls) {
          return response.data.imageUrls;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      } catch (error) {
        console.log('Backend upload failed, using mock service...');
      }

      // Fallback: Create object URLs for development
      return files.map(file => URL.createObjectURL(file));
      
    } catch (error: any) {
      console.error('❌ Error uploading images:', error);
      throw new Error('Failed to upload images');
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