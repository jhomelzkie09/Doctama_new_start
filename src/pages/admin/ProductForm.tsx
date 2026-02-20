import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import uploadService from '../../services/upload.service';
import ColorSelector from '../../components/ColorSelector';
import { 
  Save, 
  X, 
  Loader, 
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Plus,
  Trash2,
  Move,
  Ruler,
  Package,
  Palette,
  Wrench,
  ArrowLeft
} from 'lucide-react';
import { Category } from '../../types';

interface FormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  stockQuantity: string;
  length: string;
  width: string;
  height: string;
  isActive: boolean;
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  
  // Image states
  const [mainImage, setMainImage] = useState<string>('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  
  // Color states
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stockQuantity: '',
    length: '',
    width: '',
    height: '',
    isActive: true
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [isAdmin, navigate, isEditMode]);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📤 Fetching product for edit:', id);
      const product = await productService.getProductById(Number(id));
      console.log('✅ Product data loaded:', product);
      
      if (product) {
        setMainImage(product.imageUrl || '');
        
        // Handle images - extract URLs
        if (product.images && Array.isArray(product.images)) {
          const imageUrls = product.images.map(img => 
            typeof img === 'string' ? img : img.imageUrl
          );
          setAdditionalImages(imageUrls);
        }

        setSelectedColors(product.colorsVariant || []);
        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          categoryId: product.categoryId?.toString() || '',
          stockQuantity: product.stockQuantity?.toString() || '',
          length: product.length?.toString() || '',
          width: product.width?.toString() || '',
          height: product.height?.toString() || '',
          isActive: product.isActive ?? true
        });
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMainImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setAdditionalImageFiles(prev => [...prev, ...fileArray]);
    
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newPreviewImages = [...additionalImages];
    const [movedPreview] = newPreviewImages.splice(fromIndex, 1);
    newPreviewImages.splice(toIndex, 0, movedPreview);
    setAdditionalImages(newPreviewImages);
    
    const newFiles = [...additionalImageFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setAdditionalImageFiles(newFiles);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) return 'Valid price is required';
    if (!formData.categoryId) return 'Category is required';
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) return 'Valid stock quantity is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);
    setError('');
    setUploadingImages(true);
    setUploadProgress(0);
    
    try {
      let finalMainImage = mainImage;
      let finalImageUrls: string[] = [];

      // Upload new images if any
      const filesToUpload: File[] = [];
      if (mainImageFile) filesToUpload.push(mainImageFile);
      filesToUpload.push(...additionalImageFiles);

      if (filesToUpload.length > 0) {
        console.log('📤 Uploading images...', filesToUpload.length);
        
        const uploadedUrls = await uploadService.uploadImages(filesToUpload);
        console.log('✅ Upload response:', uploadedUrls);
        setUploadProgress(100);
        
        if (Array.isArray(uploadedUrls) && uploadedUrls.length > 0) {
          let urlIndex = 0;
          
          if (mainImageFile) {
            finalMainImage = uploadedUrls[urlIndex++];
          }
          
          for (let i = 0; i < additionalImageFiles.length; i++) {
            if (urlIndex < uploadedUrls.length) {
              finalImageUrls.push(uploadedUrls[urlIndex++]);
            }
          }
        }
      }

      // Combine existing and new image URLs
      const allImageUrls = [
        ...additionalImages.filter(url => !url.startsWith('blob:')), // Keep existing URLs
        ...finalImageUrls // Add new ones
      ];

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        categoryId: parseInt(formData.categoryId),
        imageUrl: finalMainImage,
        images: allImageUrls,
        height: formData.height ? parseFloat(formData.height) : 0,
        width: formData.width ? parseFloat(formData.width) : 0,
        length: formData.length ? parseFloat(formData.length) : 0,
        colorsVariant: selectedColors,
        isActive: formData.isActive
      };
      
      console.log('📤 Sending product data:', productData);

      if (isEditMode) {
        await productService.updateProduct(Number(id), productData);
        alert('Product updated successfully!');
      } else {
        await productService.createProduct(productData);
        alert('Product created successfully!');
      }
      
      navigate('/admin/products');
      
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Products"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditMode ? 'Update product information' : 'Create a new product'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
              Product Images
            </h2>
            
            {/* Main Image */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Main Image (Thumbnail)
              </label>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {mainImage ? (
                      <img 
                        src={mainImage} 
                        alt="Main" 
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
                        <span className="text-xs text-gray-400 mt-1">No image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImages ? 'Uploading...' : mainImageFile ? 'Change Image' : 'Upload Main Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Recommended size: 800x800px
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Images
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                {additionalImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={img} 
                        alt={`Product ${index + 1}`} 
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveImage(index, Math.max(0, index - 1))}
                        className="p-1 bg-white rounded-full hover:bg-gray-100"
                        disabled={index === 0}
                      >
                        <Move className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(index)}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, Math.min(additionalImages.length - 1, index + 1))}
                        className="p-1 bg-white rounded-full hover:bg-gray-100"
                        disabled={index === additionalImages.length - 1}
                      >
                        <Move className="w-3 h-3 transform rotate-180" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100">
                  <Plus className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Add Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImagesUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                </label>
              </div>
              
              {uploadingImages && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-600">Uploading...</span>
                    <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Modern Leather Sofa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  required
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Color Variants */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-blue-600" />
              Color Variants
            </h2>
            
            <ColorSelector
              colors={selectedColors}
              onChange={setSelectedColors}
            />
          </div>

          {/* Dimensions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Ruler className="w-5 h-5 mr-2 text-blue-600" />
              Dimensions (cm)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length
                </label>
                <input
                  type="number"
                  name="length"
                  min="0"
                  step="0.1"
                  value={formData.length}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width
                </label>
                <input
                  type="number"
                  name="width"
                  min="0"
                  step="0.1"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <input
                  type="number"
                  name="height"
                  min="0"
                  step="0.1"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-blue-600" />
              Status
            </h2>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active (available for sale)</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update Product' : 'Save Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;