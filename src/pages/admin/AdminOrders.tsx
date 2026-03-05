import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import uploadService from '../../services/upload.service';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Loader,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Images,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Grid,
  List,
  Star,
  Copy,
  Archive,
  ShoppingBag,
  Tag,
  X,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  FileText,
  DownloadCloud,
  Printer,
  Settings,
  Sliders,
  LayoutGrid,
  Table
} from 'lucide-react';
import { Product, Category } from '../../types';

// Extended product interface with additional fields
interface ExtendedProduct extends Product {
  revenue?: number;
  salesCount?: number;
  profit?: number;
  lastRestocked?: string;
  supplier?: string;
  variants?: ProductVariant[];
  seo?: SEOData;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>;
  imageUrl?: string;
}

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  averagePrice: number;
  topCategory: string;
}

interface FilterOptions {
  search: string;
  category: string;
  status: 'all' | 'active' | 'inactive';
  stock: 'all' | 'inStock' | 'lowStock' | 'outOfStock';
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: 'name' | 'price' | 'stock' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'table';
}

const AdminProducts = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [productStats, setProductStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
    averagePrice: 0,
    topCategory: ''
  });

  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    status: 'all',
    stock: 'all',
    priceRange: { min: 0, max: 100000 },
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'table'
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  useEffect(() => {
    calculateStats();
  }, [products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ]);
      
      // Enhance products with additional data (mock for now)
      const enhancedProducts = productsData.map(product => ({
        ...product,
        revenue: Math.random() * 100000,
        salesCount: Math.floor(Math.random() * 500),
        profit: Math.random() * 30000,
        lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        supplier: ['Supplier A', 'Supplier B', 'Supplier C'][Math.floor(Math.random() * 3)]
      }));
      
      setProducts(enhancedProducts);
      setCategories(categoriesData);
    } catch (err: any) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats: ProductStats = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      inactiveProducts: products.filter(p => !p.isActive).length,
      outOfStock: products.filter(p => p.stockQuantity === 0).length,
      lowStock: products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0),
      averagePrice: products.length > 0 
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
        : 0,
      topCategory: getTopCategory()
    };
    setProductStats(stats);
  };

  const getTopCategory = (): string => {
    const categoryCount = products.reduce((acc, p) => {
      const catId = p.categoryId;
      acc[catId] = (acc[catId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const topCatId = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    return topCatId ? categories.find(c => c.id === Number(topCatId))?.name || 'Unknown' : 'None';
  };

  // Filter and sort products - moved before the selectAll useEffect
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      const matchesSearch = filters.search === '' || 
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.search.toLowerCase());
      
      // Category filter
      const matchesCategory = filters.category === 'all' || 
        product.categoryId.toString() === filters.category;
      
      // Status filter
      const matchesStatus = filters.status === 'all' ||
        (filters.status === 'active' && product.isActive) ||
        (filters.status === 'inactive' && !product.isActive);
      
      // Stock filter
      const matchesStock = filters.stock === 'all' ||
        (filters.stock === 'inStock' && product.stockQuantity > 0) ||
        (filters.stock === 'lowStock' && product.stockQuantity > 0 && product.stockQuantity < 10) ||
        (filters.stock === 'outOfStock' && product.stockQuantity === 0);
      
      // Price range filter
      const matchesPrice = product.price >= filters.priceRange.min && 
        product.price <= filters.priceRange.max;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesStock && matchesPrice;
    }).sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stockQuantity - b.stockQuantity;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [products, filters]);

  // Handle select all - now filteredProducts is defined
  useEffect(() => {
    if (selectAll) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [selectAll, filteredProducts]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      setSuccess('Product deleted successfully');
    } catch (err: any) {
      setError('Failed to delete product');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await productService.toggleProductStatus(id, !currentStatus);
      setProducts(products.map(p => 
        p.id === id ? { ...p, isActive: !currentStatus } : p
      ));
      setSuccess(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      setError('Failed to update product status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    try {
      await Promise.all(selectedProducts.map(id => productService.deleteProduct(id)));
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      setSelectAll(false);
      setSuccess(`Deleted ${selectedProducts.length} products successfully`);
    } catch (err) {
      setError('Failed to delete some products');
    }
  };

  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedProducts.length === 0) return;
    
    try {
      await Promise.all(selectedProducts.map(id => productService.toggleProductStatus(id, status)));
      setProducts(products.map(p => 
        selectedProducts.includes(p.id) ? { ...p, isActive: status } : p
      ));
      setSelectedProducts([]);
      setSelectAll(false);
      setSuccess(`Updated ${selectedProducts.length} products successfully`);
    } catch (err) {
      setError('Failed to update some products');
    }
  };

  const handleDuplicate = async (product: ExtendedProduct) => {
    try {
      const { id, ...productData } = product;
      const newProduct = await productService.createProduct({
        ...productData,
        name: `${product.name} (Copy)`
      });
      setProducts([...products, newProduct]);
      setSuccess('Product duplicated successfully');
    } catch (err) {
      setError('Failed to duplicate product');
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'csv') {
      const dataToExport = selectedProducts.length > 0 
        ? products.filter(p => selectedProducts.includes(p.id))
        : filteredProducts;
      
      const headers = ['ID', 'Name', 'Price', 'Stock', 'Category', 'Status', 'Description'];
      const csvData = dataToExport.map(p => [
        p.id,
        p.name,
        p.price,
        p.stockQuantity,
        categories.find(c => c.id === p.categoryId)?.name || '',
        p.isActive ? 'Active' : 'Inactive',
        p.description.replace(/,/g, ';')
      ]);
      
      const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      setSuccess(`Exported ${dataToExport.length} products`);
    }
    setShowExportModal(false);
  };

  // Get all image URLs for a product
  const getAllImageUrls = (product: Product): string[] => {
    const urls: string[] = [];
    if (product.imageUrl) urls.push(product.imageUrl);
    if (product.images && Array.isArray(product.images)) {
      const imageUrls = product.images.map(img => 
        typeof img === 'string' ? img : img.imageUrl
      );
      urls.push(...imageUrls);
    }
    return urls.filter(url => url && url.trim() !== '');
  };

  // Get main image URL
  const getMainImageUrl = (product: Product): string => {
    const allUrls = getAllImageUrls(product);
    return allUrls.length > 0 ? allUrls[0] : '';
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/400x300?text=No+Image';
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory, track stock, and analyze performance</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <DownloadCloud className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{productStats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600">{productStats.activeProducts} active</span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-600">{productStats.inactiveProducts} inactive</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{productStats.totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Avg price: ₱{productStats.averagePrice.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Status</p>
                <p className="text-2xl font-bold text-gray-900">{productStats.outOfStock}</p>
              </div>
              {productStats.outOfStock > 0 ? (
                <TrendingDown className="w-8 h-8 text-red-500" />
              ) : (
                <TrendingUp className="w-8 h-8 text-green-500" />
              )}
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-yellow-600">{productStats.lowStock} low stock</span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-red-600">{productStats.outOfStock} out</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Category</p>
                <p className="text-2xl font-bold text-gray-900">{productStats.topCategory}</p>
              </div>
              <Tag className="w-8 h-8 text-purple-500" />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {categories.length} total categories
            </p>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusUpdate(true)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkStatusUpdate(false)}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
            >
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedProducts([])}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value as any });
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.stock}
              onChange={(e) => {
                setFilters({ ...filters, stock: e.target.value as any });
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock (&lt;10)</option>
              <option value="outOfStock">Out of Stock</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 border rounded-lg flex items-center ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Sliders className="w-4 h-4 mr-2" />
              More Filters
            </button>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setFilters({ ...filters, viewMode: 'table' })}
                className={`p-2 ${filters.viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFilters({ ...filters, viewMode: 'grid' })}
                className={`p-2 ${filters.viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                  <option value="createdAt">Date Added</option>
                </select>
                <button
                  onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* View Mode: Table */}
      {filters.viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={() => setSelectAll(!selectAll)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProducts.map((product) => {
                  const mainImageUrl = getMainImageUrl(product);
                  const totalImages = getAllImageUrls(product).length;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => {
                            if (selectedProducts.includes(product.id)) {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            } else {
                              setSelectedProducts([...selectedProducts, product.id]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {mainImageUrl ? (
                              <img 
                                src={mainImageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500 truncate">{product.description}</div>
                            <div className="text-xs text-gray-400 mt-1">ID: {product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">₱{product.price.toFixed(2)}</div>
                        {product.profit && (
                          <div className="text-xs text-green-600">+₱{product.profit.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          product.stockQuantity > 10 
                            ? 'bg-green-100 text-green-800'
                            : product.stockQuantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stockQuantity}
                        </span>
                        {product.lastRestocked && (
                          <div className="text-xs text-gray-400 mt-1">
                            Restocked: {new Date(product.lastRestocked).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.salesCount || 0}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-blue-600">
                          ₱{(product.revenue || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(product.id, product.isActive)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {totalImages > 0 ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Images className="w-4 h-4 mr-1 text-blue-500" />
                            <span>{totalImages}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No images</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/admin/products/${product.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Duplicate Product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">
                {filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.stock !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first product'}
              </p>
              {!filters.search && filters.category === 'all' && filters.status === 'all' && filters.stock === 'all' && (
                <button
                  onClick={() => navigate('/admin/products/new')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* View Mode: Grid */}
      {filters.viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => {
            const mainImageUrl = getMainImageUrl(product);
            const totalImages = getAllImageUrls(product).length;
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  {mainImageUrl ? (
                    <img 
                      src={mainImageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Image count badge */}
                  {totalImages > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Images className="w-3 h-3 mr-1" />
                      {totalImages}
                    </div>
                  )}
                  
                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>

                  {/* Category and Price */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                    </span>
                    <span className="text-lg font-bold text-blue-600">₱{product.price.toFixed(2)}</span>
                  </div>

                  {/* Stock and Sales */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-gray-400 mr-1" />
                      <span className={`font-medium ${
                        product.stockQuantity > 10 ? 'text-green-600' :
                        product.stockQuantity > 0 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {product.stockQuantity} in stock
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ShoppingBag className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-gray-600">{product.salesCount || 0} sold</span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => navigate(`/admin/products/${product.id}`)}
                    className="mt-4 w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-3">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{' '}
            {filteredProducts.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === currentPage - 3 ||
                pageNum === currentPage + 3
              ) {
                return <span key={pageNum} className="px-2">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Export Products</h3>
            <p className="text-sm text-gray-600 mb-4">
              Export {selectedProducts.length > 0 ? selectedProducts.length : filteredProducts.length} products as:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> Export as CSV
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Import Products</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with your product data. The file should include headers for name, description, price, stock, category, and images.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Drag and drop your CSV file here, or click to browse</p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload File
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;