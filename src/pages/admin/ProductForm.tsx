import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import uploadService from '../../services/upload.service';
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
  Wrench
} from 'lucide-react';
import { Category } from '../../types';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  
  // Image states
  const [mainImage, setMainImage] = useState<string>('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stockQuantity: '',
    
    // Color variants (as comma-separated string for easy input)
    colors: '',
    
    // Dimensions
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
      const product = await productService.getProductById(Number(id));
      if (product) {
        setMainImage(product.imageUrl || '');
        setAdditionalImages(product.images || []);
        
        // Convert colors array to comma-separated string
        const colorsString = product.colorsVariant?.join(', ') || '';
        
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          categoryId: product.categoryId.toString(),
          stockQuantity: product.stockQuantity.toString(),
          colors: colorsString,
          length: product.length?.toString() || '',
          width: product.width?.toString() || '',
          height: product.height?.toString() || '',
          isActive: product.isActive
        });
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Failed to fetch product:', err);
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
    const newImages = [...additionalImages];
    const newFiles = [...additionalImageFiles];
    const [movedImage] = newImages.splice(fromIndex, 1);
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    newFiles.splice(toIndex, 0, movedFile);
    setAdditionalImages(newImages);
    setAdditionalImageFiles(newFiles);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) return 'Valid price is required';
    if (!formData.categoryId) return 'Category is required';
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) return 'Valid stock quantity is required';
    return '';
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
    
    try {
      let imageUrl = mainImage;
      let images: string[] = additionalImages;

      // Upload new images if any
      const filesToUpload: File[] = [];
      if (mainImageFile) filesToUpload.push(mainImageFile);
      filesToUpload.push(...additionalImageFiles);

      if (filesToUpload.length > 0) {
        console.log('📤 Uploading images...', filesToUpload.length);
        const uploadedUrls = await uploadService.uploadImages(filesToUpload);
        
        let urlIndex = 0;
        if (mainImageFile) {
          imageUrl = uploadedUrls[urlIndex++];
        }
        
        images = additionalImages.map((img, idx) => {
          if (idx < additionalImageFiles.length) {
            return uploadedUrls[urlIndex++];
          }
          return img;
        });
      }

      // Convert colors string to array
      const colorsArray = formData.colors
        .split(',')
        .map(color => color.trim())
        .filter(color => color !== '');

      // Prepare product data matching your backend's expected format
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        categoryId: parseInt(formData.categoryId),
        imageUrl: imageUrl,
        images: images,
        // Dimensions
        height: formData.height ? parseFloat(formData.height) : 0,
        width: formData.width ? parseFloat(formData.width) : 0,
        length: formData.length ? parseFloat(formData.length) : 0,
        // Colors as array
        colorsVariant: colorsArray,
        // Status
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
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update product information' : 'Create a new product'}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/products')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
            <span className="text-red-700">{error}</span>
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Main Image (Thumbnail)
              </label>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {mainImage ? (
                      <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImages ? 'Uploading...' : 'Upload Main Image'}
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
                    Main image displayed in product listings
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Images (Gallery)
              </label>
              
              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                {additionalImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => moveImage(index, Math.max(0, index - 1))}
                        className="p-1 bg-white rounded-full hover:bg-gray-100"
                        title="Move Left"
                      >
                        <Move className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(index)}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, Math.min(additionalImages.length - 1, index + 1))}
                        className="p-1 bg-white rounded-full hover:bg-gray-100"
                        title="Move Right"
                      >
                        <Move className="w-3 h-3 transform rotate-180" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Upload Button */}
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
              <p className="text-xs text-gray-500">
                Upload multiple images. They will be uploaded when you save.
              </p>
            </div>
          </div>

          {/* Basic Info Section */}
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

          {/* Color Variants Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-blue-600" />
              Color Variants
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Colors
              </label>
              <input
                type="text"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Brown, Black, White, Gray"
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter colors separated by commas (e.g., Brown, Black, White)
              </p>
            </div>
          </div>

          {/* Dimensions Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Ruler className="w-5 h-5 mr-2 text-blue-600" />
              Dimensions (in cm)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length (cm)
                </label>
                <input
                  type="number"
                  name="length"
                  min="0"
                  step="0.1"
                  value={formData.length}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="width"
                  min="0"
                  step="0.1"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  min="0"
                  step="0.1"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
            
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active (available for sale)</span>
              </label>
            </div>
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