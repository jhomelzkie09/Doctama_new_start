import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import categoryService, { Category } from '../../services/category.service';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader,
  AlertCircle,
  Folder,
  Package
} from 'lucide-react';

const CategoriesManagement = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [isAdmin, navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      
      // If API returns empty, use furniture shop mock data
      if (data.length === 0) {
        const mockCategories: Category[] = [
          { id: 1, name: 'Sofas & Couches', description: 'Comfortable seating for your living room', productCount: 12 },
          { id: 2, name: 'Dining Tables', description: 'Elegant tables for family meals', productCount: 8 },
          { id: 3, name: 'Beds & Mattresses', description: 'Quality beds for good sleep', productCount: 10 },
          { id: 4, name: 'Chairs', description: 'Comfortable chairs for every room', productCount: 15 },
          { id: 5, name: 'Cabinets & Storage', description: 'Organize your space with style', productCount: 7 },
          { id: 6, name: 'Office Furniture', description: 'Ergonomic furniture for work', productCount: 9 },
          { id: 7, name: 'Outdoor Furniture', description: 'Durable furniture for patios', productCount: 6 },
          { id: 8, name: 'Lighting', description: 'Beautiful lighting fixtures', productCount: 11 }
        ];
        setCategories(mockCategories);
      } else {
        setCategories(data);
      }
    } catch (err: any) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
        alert('Category updated successfully!');
      } else {
        await categoryService.createCategory(formData);
        alert('Category created successfully!');
      }
      
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', imageUrl: '' });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoryService.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      alert('Failed to delete category');
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
            <p className="text-gray-600 mt-1">Organize your furniture products by categories</p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', description: '', imageUrl: '' });
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Category Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sofas & Couches"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this category..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/category-image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Folder className="w-12 h-12 text-white opacity-75" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 text-gray-600 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-1 text-gray-600 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Package className="w-4 h-4 mr-1" />
                  <span>{category.productCount || 0} products</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Categories Yet</h3>
            <p className="text-gray-500 mb-6">Create your first category to organize your furniture products</p>
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: '', description: '', imageUrl: '' });
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesManagement;