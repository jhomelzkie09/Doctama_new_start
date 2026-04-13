import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import orderService from '../../services/order.service';
import { 
  Plus, Search, Edit, Trash2, Eye, Filter, Loader, Package, 
  AlertCircle, ChevronLeft, ChevronRight, Grid, List, 
  Layers, ShoppingBag, ArrowUpRight, Inbox, CheckCircle2, AlertTriangle,
  TrendingUp, DollarSign, Calendar, BarChart3, X, TrendingDown,
  Clock, Award, Star, Zap
} from 'lucide-react';
import { Product, Category } from '../../types';
import { showSuccess, showError, showWarning, showInfo } from '../../utils/toast';

interface ProductStats {
  totalSold: number;
  totalRevenue: number;
  averageMonthlySales: number;
  lastSoldDate: string | null;
  daysSinceLastSale: number | null;
  salesTrend: 'increasing' | 'decreasing' | 'stable';
  monthlyData: { month: string; sales: number }[];
}

const ProductsManagement = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  const itemsPerPage = 12;

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
      
      // Calculate sold counts for sorting
      const productsWithSales = await Promise.all(productsData.map(async (product) => {
        const stats = await calculateProductStats(product.id);
        return { ...product, _soldCount: stats.totalSold };
      }));
      
      // Sort by sold count (highest first)
      const sortedProducts = productsWithSales.sort((a, b) => (b._soldCount || 0) - (a._soldCount || 0));
      setProducts(sortedProducts);
      setCategories(categoriesData);
    } catch (err: any) {
      setError('Failed to load products');
      showError('Failed to load products');
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
      
      const deliveredOrders = allOrders.filter(order => order.status === 'delivered');
      
      deliveredOrders.forEach(order => {
        order.items?.forEach(item => {
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
      
      const monthlyData = Array.from(monthlySalesMap.entries())
        .map(([month, sales]) => ({ month, sales }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      const averageMonthlySales = monthlyData.length > 0 ? totalSold / monthlyData.length : 0;
      
      let daysSinceLastSale = null;
      if (lastSoldDate) {
        const lastDate = new Date(lastSoldDate);
        const today = new Date();
        daysSinceLastSale = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
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
      showError('Failed to load product statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await productService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      showSuccess('Product deleted successfully');
    } catch (err: any) {
      showError('Failed to delete product');
    }
  };

  // Auto-deactivate product when stock becomes 0
  const handleAutoDeactivate = async (product: Product) => {
    if (product.stockQuantity === 0 && product.isActive) {
      try {
        await productService.toggleProductStatus(product.id, false);
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, isActive: false } : p
        ));
        showWarning(`${product.name} has been auto-deactivated (out of stock)`);
      } catch (err) {
        console.error('Failed to auto-deactivate product:', err);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2).toLocaleString()}`;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Run auto-deactivation check on all products
  useEffect(() => {
    filteredProducts.forEach(product => {
      if (product.stockQuantity === 0 && product.isActive) {
        handleAutoDeactivate(product);
      }
    });
  }, [filteredProducts]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryName = (categoryId: number) => categories.find(c => c.id === categoryId)?.name || 'General';

  // Stats Logic
  const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Loading Inventory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-slate-500 font-medium">Manage and monitor your product catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Grid className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
            </div>
            <button 
              onClick={() => navigate('/admin/products/new')}
              className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Product
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Products', value: products.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Items', value: products.filter(p => p.isActive).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Out of Stock', value: outOfStockCount, icon: ShoppingBag, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}><stat.icon className="w-6 h-6" /></div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-600 font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => {
              const isOutOfStock = product.stockQuantity === 0;
              const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
              
              return (
                <div key={product.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                  <div className="relative h-52 bg-slate-100">
                    <img 
                      src={product.imageUrl || 'https://via.placeholder.com/400x300'} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg backdrop-blur-md ${
                        product.isActive ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/90 text-white'
                      }`}>
                        {product.isActive ? 'Active' : 'Draft'}
                      </span>
                    </div>
                    {/* Stock Warning Badge */}
                    {isOutOfStock && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-rose-500/90 text-white flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-amber-500/90 text-white flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{getCategoryName(product.categoryId)}</p>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</p>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`h-2 w-2 rounded-full ${product.stockQuantity > 5 ? 'bg-emerald-500' : product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <p className={`text-xs font-semibold ${product.stockQuantity > 5 ? 'text-emerald-600' : product.stockQuantity > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {product.stockQuantity} in stock
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewStats(product)}
                        className="p-2 bg-slate-50 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-lg transition-colors border border-slate-100"
                        title="View Statistics"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 py-2 rounded-lg font-bold text-xs transition-colors border border-slate-100 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-slate-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View with stats button */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Price</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((product) => {
                  const isOutOfStock = product.stockQuantity === 0;
                  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                            <p className="text-xs text-slate-400">{getCategoryName(product.categoryId)}</p>
                          </div>
                        </div>
                        </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <AlertTriangle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            {product.stockQuantity} Left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            {product.stockQuantity} in stock
                          </span>
                        )}
                        </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleViewStats(product)} 
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title="View Statistics"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No products found</h3>
            <p className="text-slate-500 mb-6">Try different keywords or filters.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of {filteredProducts.length}
            </p>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
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

export default ProductsManagement;