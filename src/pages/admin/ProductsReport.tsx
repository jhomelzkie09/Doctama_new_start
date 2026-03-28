import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import reportService from '../../services/report.service';
import productService from '../../services/product.service';
import { useOrders } from '../../contexts/OrderContext';

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

    switch (format) {
      case 'excel':
        reportService.exportToExcel(reportData, `products_report_${new Date().toISOString().split('T')[0]}`);
        break;
      case 'csv':
        reportService.exportToCSV(reportData, `products_report_${new Date().toISOString().split('T')[0]}`);
        break;
      case 'json':
        reportService.exportToJSON(reportData, `products_report_${new Date().toISOString().split('T')[0]}`);
        break;
    }
    setLoading(false);
  };

  const handlePrint = () => {
    reportService.printReport('products-report-content');
  };

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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Export to Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Export to CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
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

      {/* Report Content */}
      <div id="products-report-content" className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Products Inventory Report</h2>
          <p className="text-gray-600 mt-1">
            Generated on: {new Date().toLocaleString()}
          </p>
        </div>

        <div className="overflow-x-auto">
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
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsReport;