import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, DollarSign, Eye } from 'lucide-react';
import reportService from '../../services/report.service';
import productService from '../../services/product.service';
import PDFReportModal from '../../components/admin/PDFReportModal';

const ProductsReport: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [productStats, setProductStats] = useState<any[]>([]);
  const [showPDFModal, setShowPDFModal] = useState(false);

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
    const totalSold = productStats.reduce((sum, p) => sum + p.sold, 0);
    const lowStock = productStats.filter(p => p.stock < 10).length;
    
    return { totalProducts, totalStock, totalRevenue, totalSold, lowStock };
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
    window.print();
  };

  const handlePreviewPDF = () => {
    setShowPDFModal(true);
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

  const ReportContent = () => (
    <>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total Products</p>
          <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total Stock</p>
          <p className="text-lg font-bold text-gray-900">{stats.totalStock}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-lg font-bold text-gray-900">₱{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total Sold</p>
          <p className="text-lg font-bold text-gray-900">{stats.totalSold}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {productStats.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Product Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Price</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Stock</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Sold</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Revenue</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productStats.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-2 text-gray-600">{product.category}</td>
                  <td className="px-4 py-2 text-gray-900">₱{product.price.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={product.stock < 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{product.sold}</td>
                  <td className="px-4 py-2 text-gray-900">₱{product.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2">
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
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-4 py-2 text-right font-semibold">TOTALS:</td>
                <td className="px-4 py-2 font-bold text-gray-900">-</td>
                <td className="px-4 py-2 font-bold text-gray-900">{stats.totalStock}</td>
                <td className="px-4 py-2 font-bold text-gray-900">{stats.totalSold}</td>
                <td className="px-4 py-2 font-bold text-gray-900">₱{stats.totalRevenue.toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-600">{stats.lowStock} Low Stock</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </>
  );

  const summaryContent = (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-semibold text-gray-800">Inventory Summary</p>
        <p className="text-xs text-gray-600">Total Products: {stats.totalProducts}</p>
        <p className="text-xs text-gray-600">Total Stock: {stats.totalStock}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-800">Sales Summary</p>
        <p className="text-xs text-gray-600">Units Sold: {stats.totalSold}</p>
        <p className="text-xs text-gray-600">Total Revenue: ₱{stats.totalRevenue.toLocaleString()}</p>
        <p className="text-xs text-red-600">Low Stock Items: {stats.lowStock}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products Report</h1>
        <p className="text-gray-600 mt-1">View and export product inventory and sales data</p>
      </div>

      <div className="flex justify-end mb-6 gap-2">
        <button
          onClick={handlePreviewPDF}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
        >
          <Eye className="w-4 h-4" />
          Preview Report
        </button>
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

      {/* PDF Report Modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Products Report"
        onPrint={handlePrint}
        onExport={() => handleExport('excel')}
        period="Current Inventory"
        summary={summaryContent}
      >
        <ReportContent />
      </PDFReportModal>
    </div>
  );
};

export default ProductsReport;