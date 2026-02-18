import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import { 
  Save, 
  X, 
  Loader, 
  Upload,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Category } from '../../types';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stockQuantity: '',
    imageUrl: '',
    isActive: true,
    isFeatured: false
  });

  // In ProductForm.tsx, before the useEffect that's causing the warning:
useEffect(() => {
  if (!isAdmin) {
    navigate('/admin');
    return;
  }
  fetchCategories();
  if (isEditMode) {
    fetchProduct();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAdmin, navigate, isEditMode]); // Add the comment to ignore the warning

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const product = await productService.getProductById(Number(id));
      if (product) {
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          categoryId: product.categoryId.toString(),
          stockQuantity: product.stockQuantity.toString(),
          imageUrl: product.imageUrl || '',
          isActive: product.isActive,
          isFeatured: product.isFeatured || false
        });
        if (product.imageUrl) {
          setImagePreview(product.imageUrl);
        }
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const imageUrl = await productService.uploadProductImage(file);
      setFormData(prev => ({ ...prev, imageUrl }));
    } catch (err) {
      alert('Failed to upload image');
    }
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
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        stockQuantity: parseInt(formData.stockQuantity),
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured
      };

      if (isEditMode) {
        await productService.updateProduct(Number(id), productData);
        alert('Product updated successfully!');
      } else {
        await productService.createProduct(productData);
        alert('Product created successfully!');
      }
      
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto px-4">
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
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Main Form */}
          <div className="p-8 space-y-6">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Product Image
              </label>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="ml-3 text-sm text-gray-500">
                      or enter URL below
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* Image URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Name */}
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
                placeholder="Enter product name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Price and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stock Quantity */}
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
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Toggles */}
            <div className="flex items-center space-x-8 pt-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Product</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">📝 Tips for good product listings:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Use clear, descriptive product names</li>
            <li>Write detailed descriptions highlighting features and benefits</li>
            <li>Upload high-quality images showing the product from different angles</li>
            <li>Set accurate prices and stock quantities</li>
            <li>Select the most appropriate category</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;