import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, DollarSign, Printer, Download } from 'lucide-react';
import reportService from '../../services/report.service';
import productService from '../../services/product.service';
import { useOrders } from '../../contexts/OrderContext';
import logo from '../../assets/logo.png';

const ProductsReport: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [productStats, setProductStats] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await productService.getProducts();
      setProducts(allProducts);
      calculateProductStats(allProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProductStats = (products: any[]) => {
    // Mock data - replace with actual sales data
    const stats = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.categoryId,
      price: product.price,
      stock: product.stockQuantity,
      sold: Math.floor(Math.random() * 100), // Replace with actual sales data
      revenue: product.price * Math.floor(Math.random() * 100)
    }));
    setProductStats(stats);
  };

  const getTotalStats = () => {
    const totalProducts = productStats.length;
    const totalStock = productStats.reduce((sum, p) => sum + p.stock, 0);
    const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0);
    const lowStock = productStats.filter(p => p.stock < 10).length;
    
    return { totalProducts, totalStock, totalRevenue, lowStock };
  };

  const stats = getTotalStats();

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setLoading(true);
    const reportData = productStats.map(product => ({
      'Product ID': product.id,
      'Name': product.name,
      'Category': product.category,
      'Price': `₱${product.price.toLocaleString()}`,
      'Current Stock': product.stock,
      'Units Sold': product.sold,
      'Revenue': `₱${product.revenue.toLocaleString()}`,
      'Status': product.stock < 10 ? 'Low Stock' : product.stock === 0 ? 'Out of Stock' : 'In Stock'
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'excel':
        reportService.exportToExcel(reportData, `products_report_${dateStr}`);
        break;
      case 'csv':
        reportService.exportToCSV(reportData, `products_report_${dateStr}`);
        break;
      case 'json':
        reportService.exportToJSON(reportData, `products_report_${dateStr}`);
        break;
    }
    setLoading(false);
  };

  const handlePrint = () => {
    reportService.printReport('products-report-content');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products Report</h1>
        <p className="text-gray-600 mt-1">View and export product inventory and sales data</p>
      </div>

      <div className="flex justify-end mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStock}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Report Content for Printing - UPDATED with Logo, Company Name and Address */}
      <div id="products-report-content" className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Company Header for Print */}
        <div className="p-6 border-b bg-gray-50 print:bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-lg flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Doctama's Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Company Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctama's Marketing</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gabao, Bacon, Sorsogon City, Sorsogon, Philippines
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tel: +63 998 586 8888 | Email: support@doctama.com
                </p>
              </div>
            </div>
            {/* Report Title and Date */}
            <div className="text-right">
              <div className="bg-rose-50 px-4 py-2 rounded-lg">
                <p className="text-xs text-rose-600 font-medium">PRODUCTS REPORT</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="p-6 border-b bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Report Type</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">Inventory & Sales Analysis</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Generated On</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {new Date().toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Generated By</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Report Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Products Inventory Report</h2>
          <p className="text-gray-600 mt-1">
            Generated on: {new Date().toLocaleString()}
          </p>
          <div className="mt-2 flex gap-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Total Products:</span> {stats.totalProducts}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Total Stock:</span> {stats.totalStock}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Total Revenue:</span> ₱{stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {productStats.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productStats.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ₱{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.stock < 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.sold}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ₱{product.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.stock === 0 ? 'bg-red-100 text-red-800' :
                        product.stock < 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' :
                         product.stock < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Footer Summary Row */}
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    TOTALS:
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    {stats.totalStock}
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    {productStats.reduce((sum, p) => sum + p.sold, 0)}
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    ₱{stats.totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {stats.lowStock} Low Stock
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer for Printing */}
        <div className="p-6 border-t bg-gray-50 print:bg-white">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <p>Doctama's Marketing - Gabao, Bacon, Sorsogon City, Sorsogon, Philippines</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="mt-2 text-center text-xs text-gray-400">
            <p>This is a computer-generated document. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsReport;