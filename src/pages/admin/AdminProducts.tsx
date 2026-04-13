import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import orderService from '../../services/order.service';
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
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  X,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Product, Category } from '../../types';

interface ProductStats {
  totalSold: number;
  totalRevenue: number;
  averageMonthlySales: number;
  lastSoldDate: string | null;
  daysSinceLastSale: number | null;
  salesTrend: 'increasing' | 'decreasing' | 'stable';
  monthlyData: { month: string; sales: number }[];
}

const AdminProducts = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ]);
      
      // Sort products by sold count (highest first)
      const productsWithSales = await Promise.all(productsData.map(async (product) => {
        const stats = await calculateProductStats(product.id);
        return { ...product, _soldCount: stats.totalSold };
      }));
      
      const sortedProducts = productsWithSales.sort((a, b) => (b._soldCount || 0) - (a._soldCount || 0));
      setProducts(sortedProducts);
      setCategories(categoriesData);
    } catch (err: any) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProductStats = async (productId: number): Promise<ProductStats> => {
    try {
      const allOrders = await orderService.getAllOrders();
      
      let totalSold = 0;
      let totalRevenue = 0;
      let lastSoldDate: string | null = null;
      const monthlySalesMap = new Map<string, number>();
      
      // Process delivered orders only
      const deliveredOrders = allOrders.filter(order => order.status === 'delivered');
      
      deliveredOrders.forEach(order => {
        order.items?.forEach(item => {
          // Fix: Convert both to number for comparison
          const itemProductId = typeof item.productId === 'string' ? parseInt(item.productId) : item.productId;
          if (itemProductId === productId) {
            const quantity = item.quantity;
            const revenue = (item.unitPrice || item.price) * quantity;
            totalSold += quantity;
            totalRevenue += revenue;
            
            const orderDate = new Date(order.orderDate);
            const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            monthlySalesMap.set(monthKey, (monthlySalesMap.get(monthKey) || 0) + quantity);
            
            if (!lastSoldDate || new Date(order.orderDate) > new Date(lastSoldDate)) {
              lastSoldDate = order.orderDate;
            }
          }
        });
      });
      
      // Calculate average monthly sales
      const monthlyData = Array.from(monthlySalesMap.entries())
        .map(([month, sales]) => ({ month, sales }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      const averageMonthlySales = monthlyData.length > 0 
        ? totalSold / monthlyData.length 
        : 0;
      
      // Calculate days since last sale
      let daysSinceLastSale = null;
      if (lastSoldDate) {
        const lastDate = new Date(lastSoldDate);
        const today = new Date();
        daysSinceLastSale = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Calculate sales trend (compare last 2 months vs previous 2 months)
      let salesTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (monthlyData.length >= 4) {
        const lastTwoMonths = monthlyData.slice(-2).reduce((sum, m) => sum + m.sales, 0);
        const previousTwoMonths = monthlyData.slice(-4, -2).reduce((sum, m) => sum + m.sales, 0);
        if (lastTwoMonths > previousTwoMonths) salesTrend = 'increasing';
        else if (lastTwoMonths < previousTwoMonths) salesTrend = 'decreasing';
      }
      
      return {
        totalSold,
        totalRevenue,
        averageMonthlySales,
        lastSoldDate,
        daysSinceLastSale,
        salesTrend,
        monthlyData
      };
    } catch (error) {
      console.error('Failed to calculate product stats:', error);
      return {
        totalSold: 0,
        totalRevenue: 0,
        averageMonthlySales: 0,
        lastSoldDate: null,
        daysSinceLastSale: null,
        salesTrend: 'stable',
        monthlyData: []
      };
    }
  };

  const handleViewStats = async (product: Product) => {
    setSelectedProduct(product);
    setStatsLoading(true);
    setShowStatsModal(true);
    
    try {
      const stats = await calculateProductStats(product.id);
      setProductStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Failed to delete product');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await productService.toggleProductStatus(id, !currentStatus);
      setProducts(products.map(p => 
        p.id === id ? { ...p, isActive: !currentStatus } : p
      ));
    } catch (err: any) {
      alert('Failed to update product status');
      await fetchData();
    }
  };

  const getAllImageUrls = (product: Product): string[] => {
    const urls: string[] = [];
    
    if (product.imageUrl) {
      urls.push(product.imageUrl);
    }
    
    if (product.images && Array.isArray(product.images)) {
      const imageUrls = product.images.map(img => 
        typeof img === 'string' ? img : img.imageUrl
      );
      urls.push(...imageUrls);
    }
    
    return urls.filter(url => url && url.trim() !== '');
  };

  const getMainImageUrl = (product: Product): string => {
    const allUrls = getAllImageUrls(product);
    return allUrls.length > 0 ? allUrls[0] : '';
  };

  const getAdditionalImages = (product: Product): string[] => {
    const allUrls = getAllImageUrls(product);
    return allUrls.slice(1);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/400x300?text=No+Image';
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2).toLocaleString()}`;
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => {
                const mainImageUrl = getMainImageUrl(product);
                const additionalImages = getAdditionalImages(product);
                const totalImages = getAllImageUrls(product).length;
                const isOutOfStock = product.stockQuantity === 0;
                const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
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
                          <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                          <div className="text-xs text-gray-500 mb-2">{product.description?.substring(0, 60)}...</div>
                          
                          {additionalImages.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {additionalImages.slice(0, 3).map((url, index) => (
                                <div key={index} className="w-8 h-8 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                                  <img 
                                    src={url} 
                                    alt={`${product.name} ${index + 2}`} 
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                  />
                                </div>
                              ))}
                              {additionalImages.length > 3 && (
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600 font-medium">
                                  +{additionalImages.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                    </td>
                    
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {product.stockQuantity} left
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {product.stockQuantity} in stock
                        </span>
                      )}
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
                          <span>{totalImages} {totalImages === 1 ? 'image' : 'images'}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No images</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewStats(product)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Statistics"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
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

        {/* Empty State */}
        {paginatedProducts.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first product'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Product Statistics Modal */}
      {showStatsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Product Statistics</h2>
                  <p className="text-sm text-gray-500">{selectedProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {statsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-500">Loading statistics...</p>
                </div>
              ) : productStats ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-medium text-green-600 uppercase">Units Sold</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{productStats.totalSold}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600 uppercase">Total Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(productStats.totalRevenue)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600 uppercase">Avg Monthly Sales</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(productStats.averageMonthlySales)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-medium text-amber-600 uppercase">Sales Trend</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {productStats.salesTrend === 'increasing' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : productStats.salesTrend === 'decreasing' ? (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <BarChart3 className="w-5 h-5 text-gray-600" />
                        )}
                        <p className={`text-xl font-bold ${
                          productStats.salesTrend === 'increasing' ? 'text-green-600' :
                          productStats.salesTrend === 'decreasing' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {productStats.salesTrend === 'increasing' ? '↑ Increasing' :
                           productStats.salesTrend === 'decreasing' ? '↓ Decreasing' :
                           '→ Stable'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last Sale Info */}
                  {productStats.lastSoldDate && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Last Sold</p>
                          <p className="font-medium text-gray-900">
                            {new Date(productStats.lastSoldDate).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {productStats.daysSinceLastSale !== null && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Days Since Last Sale</p>
                            <p className={`font-bold ${
                              productStats.daysSinceLastSale > 30 ? 'text-red-600' :
                              productStats.daysSinceLastSale > 14 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {productStats.daysSinceLastSale} days ago
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Monthly Sales Chart */}
                  {productStats.monthlyData.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Sales Performance</h3>
                      <div className="space-y-2">
                        {productStats.monthlyData.slice(-6).map((data) => {
                          const maxSales = Math.max(...productStats.monthlyData.map(d => d.sales), 1);
                          const percentage = (data.sales / maxSales) * 100;
                          return (
                            <div key={data.month}>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>{data.month}</span>
                                <span className="font-medium">{data.sales} units</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Performance Note */}
                  {productStats.totalSold === 0 && (
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">No Sales Yet</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            This product hasn't been sold yet. Consider promoting it or adjusting the price to attract customers.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {productStats.totalSold > 0 && productStats.daysSinceLastSale && productStats.daysSinceLastSale > 60 && (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">Slow Moving Product</p>
                          <p className="text-xs text-orange-700 mt-1">
                            This product hasn't been sold in over 60 days. Consider running a promotion or discount.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;