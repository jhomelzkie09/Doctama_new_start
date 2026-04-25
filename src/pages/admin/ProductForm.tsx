import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import uploadService from '../../services/upload.service';
import ColorSelector from '../../components/ColorSelector';
import { 
  Save, 
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
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { Category } from '../../types';
import { showSuccess, showError } from '../../utils/toast';

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

interface ImageItem {
  id?: string;
  url: string;
  isNew: boolean;
  file?: File;
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
  
  const [mainImage, setMainImage] = useState<ImageItem | null>(null);
  const [additionalImages, setAdditionalImages] = useState<ImageItem[]>([]);
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
      const product = await productService.getProductById(Number(id));
      if (product) {
        if (product.imageUrl) {
          setMainImage({ id: `main-${Date.now()}`, url: product.imageUrl, isNew: false });
        } else {
          setMainImage(null);
        }
        let imageUrls: string[] = [];
        if (product.images && Array.isArray(product.images)) {
          imageUrls = product.images.map(img =>
            typeof img === 'string' ? img : img.imageUrl
          ).filter(url => url && url.trim() !== '');
        }
        const additionalUrls = imageUrls.filter(url => url !== product.imageUrl);
        setAdditionalImages(additionalUrls.map((url, index) => ({
          id: `existing-${index}-${Date.now()}`,
          url,
          isNew: false
        })));
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
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImage({ id: `new-main-${Date.now()}`, url: reader.result as string, isNew: true, file });
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImages(prev => [...prev, {
          id: `new-${Date.now()}-${Math.random()}`,
          url: reader.result as string,
          isNew: true,
          file
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMainImage = () => setMainImage(null);

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...additionalImages];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    setAdditionalImages(newImages);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) return 'Valid price is required';
    if (!formData.categoryId) return 'Category is required';
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) return 'Valid stock quantity is required';
    return null;
  };

  const checkProductExists = async (): Promise<boolean> => {
    try {
      return await productService.checkProductNameExists(formData.name.trim(), isEditMode ? Number(id) : undefined);
    } catch (err) {
      console.error('Error checking product existence:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { showError(validationError); return; }

    // Check for duplicate product name (only for new products)
    if (!isEditMode) {
      const productExists = await checkProductExists();
      if (productExists) {
        showError('A product with this name already exists. Please choose a different name.');
        return;
      }
    }

    setSaving(true);
    setError('');
    setUploadingImages(true);
    setUploadProgress(0);

    try {
      const imagesToUpload: File[] = [];
      if (mainImage?.isNew && mainImage.file) imagesToUpload.push(mainImage.file);
      additionalImages.forEach(img => { if (img.isNew && img.file) imagesToUpload.push(img.file); });

      let uploadedUrls: string[] = [];
      if (imagesToUpload.length > 0) {
        uploadedUrls = await uploadService.uploadImages(imagesToUpload);
        setUploadProgress(100);
      }

      let uploadedIndex = 0;
      let finalMainImage = '';
      const finalAdditionalImages: string[] = [];

      if (mainImage) {
        finalMainImage = mainImage.isNew ? (uploadedUrls[uploadedIndex++] || '') : mainImage.url;
      }
      additionalImages.forEach(img => {
        if (img.isNew) { const u = uploadedUrls[uploadedIndex++]; if (u) finalAdditionalImages.push(u); }
        else finalAdditionalImages.push(img.url);
      });

      const allImages = [finalMainImage, ...finalAdditionalImages].filter(url => url && url.trim() !== '');
      const uniqueImages: string[] = [];
      allImages.forEach(url => { if (!uniqueImages.includes(url)) uniqueImages.push(url); });

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        categoryId: parseInt(formData.categoryId),
        imageUrl: uniqueImages[0] || '',
        images: uniqueImages,
        height: formData.height ? parseFloat(formData.height) : 0,
        width: formData.width ? parseFloat(formData.width) : 0,
        length: formData.length ? parseFloat(formData.length) : 0,
        colorsVariant: selectedColors,
        isActive: formData.isActive
      };

      if (isEditMode) {
        await productService.updateProduct(Number(id), productData);
        alert('Product updated successfully!');
      } else {
        await productService.createProduct(productData);
        showSuccess('Product created successfully!');
      }
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
      showError(err.message || 'Failed to save product');
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top header bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Products
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-sm font-semibold text-slate-800">
              {isEditMode ? 'Edit product' : 'New product'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={saving || uploadingImages}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" />{isEditMode ? 'Update product' : 'Save product'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form id="product-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN — images + colors */}
            <div className="lg:col-span-1 flex flex-col gap-6">

              {/* Media card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    Media
                  </h2>
                </div>

                {/* Main image */}
                <div className="p-5 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Cover image</p>
                  <div className="relative group">
                    {mainImage ? (
                      <div className="relative rounded-xl overflow-hidden aspect-square bg-slate-100">
                        <img
                          src={mainImage.url}
                          alt="Main"
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 bg-white text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            Replace
                            <input type="file" accept="image/*" onChange={handleMainImageUpload} disabled={uploadingImages} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={removeMainImage}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-xs font-medium text-slate-500">Upload cover image</span>
                          <span className="text-xs text-slate-400">800 × 800px recommended</span>
                        </div>
                        <input type="file" accept="image/*" onChange={handleMainImageUpload} disabled={uploadingImages} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional images */}
                <div className="p-5 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Gallery</p>
                  <div className="grid grid-cols-3 gap-2">
                    {additionalImages.map((img, index) => (
                      <div key={img.id} className="relative group aspect-square">
                        <div className="w-full h-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={img.url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveImage(index, Math.max(0, index - 1))}
                            disabled={index === 0}
                            className="p-1 bg-white/90 rounded-md disabled:opacity-30 hover:bg-white transition-colors"
                          >
                            <Move className="w-3 h-3 text-slate-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="p-1 bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center cursor-pointer gap-1">
                      <Plus className="w-5 h-5 text-slate-400" />
                      <span className="text-xs text-slate-400">Add</span>
                      <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesUpload} disabled={uploadingImages} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Upload progress */}
                {uploadingImages && (
                  <div className="px-5 py-3 border-b border-slate-100">
                    <div className="flex justify-between text-xs text-indigo-600 font-medium mb-1.5">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Color variants — inside media card */}
                <div className="p-5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                    Color variants
                  </p>
                  <ColorSelector
                    colors={selectedColors}
                    onChange={setSelectedColors}
                  />
                </div>
              </div>

              {/* Status card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-500" />
                    Status
                  </h2>
                </div>
                <div className="p-5">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Active listing</p>
                      <p className="text-xs text-slate-400 mt-0.5">Visible and available for purchase</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-checked:bg-indigo-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-indigo-300"></div>
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — info + dimensions */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Basic info card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    Basic information
                  </h2>
                </div>
                <div className="p-6 flex flex-col gap-5">

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Product name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
                      placeholder="e.g., Modern Leather Sofa"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent focus:bg-white transition-all text-slate-700"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400 resize-none"
                      placeholder="Describe the product in detail..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Price (₱) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₱</span>
                        <input
                          type="number"
                          name="price"
                          required
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Stock quantity <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        name="stockQuantity"
                        required
                        min="0"
                        value={formData.stockQuantity}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensions card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-500" />
                    Dimensions
                    <span className="ml-auto text-xs font-normal text-slate-400">in centimeters (cm)</span>
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {(['length', 'width', 'height'] as const).map((dim) => (
                      <div key={dim}>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 capitalize">
                          {dim}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name={dim}
                            min="0"
                            step="0.1"
                            value={formData[dim]}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
                            placeholder="0.0"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Visual hint */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-6 border-2 border-slate-300 rounded relative flex-shrink-0">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-2 bg-slate-300" />
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-px w-2 bg-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Dimensions are used for shipping calculations and product listings.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;