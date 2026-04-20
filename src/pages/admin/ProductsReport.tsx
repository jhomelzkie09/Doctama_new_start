import React, { useState, useEffect, useCallback } from 'react';
import { Package, Eye, RefreshCw, Download, Printer, Loader } from 'lucide-react';
import reportService from '../../services/report.service';
import productService from '../../services/product.service';
import orderService from '../../services/order.service';
import PDFReportModal from '../../components/admin/PDFReportModal';
import logo from '../../assets/logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRange {
  start: string;
  end: string;
}

interface ProductStat {
  id: string | number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  revenue: number;
  returned: number;
}

interface TotalStats {
  totalProducts: number;
  totalStock: number;
  totalRevenue: number;
  totalSold: number;
}

// ─── Loading Overlay Component ────────────────────────────────────────────────

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-t-violet-400 border-r-transparent border-b-transparent border-l-transparent animate-spin animation-delay-300"></div>
      </div>
      <p className="text-slate-700 font-semibold text-lg">{message}</p>
      <p className="text-slate-400 text-sm">Please wait while we compile your data...</p>
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toLocalDateStr = (value: string | Date | undefined): string => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const toDisplayDate = (value: string | Date | undefined): string => {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

const peso = (n: number) => `₱${n.toLocaleString()}`;

// ─── Company Header Component for PDF/Print ───────────────────────────────────

const CompanyHeader: React.FC = () => (
  <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-200">
    <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-white shadow-sm">
      <img
        src={logo}
        alt="Doctama's Marketing Logo"
        className="w-14 h-14 object-contain"
      />
    </div>
    <div>
      <h1 className="text-xl font-bold text-gray-900 leading-tight">
        Doctama's Marketing
      </h1>
      <p className="text-sm text-gray-600 mt-0.5">
        Gabao, Bacon, Sorsogon City, Sorsogon, Philippines
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
        <span>📞 +63 998 586 8888</span>
        <span>✉️ support@doctama.com</span>
        <span>🌐 www.doctamasmarketing.com</span>
      </div>
    </div>
  </div>
);

// ─── Product Table Component (Simplified - No Returned Column) ────────────────

interface ProductTableProps {
  products: ProductStat[];
  stats: TotalStats;
  isLoading?: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-400">Loading product data...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No products found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
              <td className="px-4 py-3 text-gray-600">{product.category}</td>
              <td className="px-4 py-3 text-gray-900">{peso(product.price)}</td>
              <td className="px-4 py-3">
                <span className={product.stock < 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {product.stock}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{product.sold}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{peso(product.revenue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200">
            <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-gray-600">Totals</td>
            <td className="px-4 py-3 text-gray-400">—</td>
            <td className="px-4 py-3 font-semibold text-gray-900">{stats.totalStock}</td>
            <td className="px-4 py-3 font-semibold text-gray-900">{stats.totalSold}</td>
            <td className="px-4 py-3 font-semibold text-gray-900">{peso(stats.totalRevenue)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductsReport: React.FC = () => {
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const allProducts = await productService.getProducts();
      const allOrders = await orderService.getAllOrders();
      
      const productSalesMap = new Map<string | number, { sold: number; revenue: number }>();
      const productInfoMap = new Map<string | number, { name: string; category: string; price: number; stock: number }>();
      
      allProducts.forEach((p: any) => {
        const productId = String(p.id);
        productInfoMap.set(productId, {
          name: p.name,
          category: p.categoryName || `Category ${p.categoryId}`,
          price: p.price,
          stock: p.stockQuantity ?? 0
        });
        productSalesMap.set(productId, { sold: 0, revenue: 0 });
      });
      
      allOrders.forEach((order: any) => {
        const orderDate = order.orderDate ?? order.createdAt;
        const isWithinDateRange = orderDate && toLocalDateStr(orderDate) >= dateRange.start && toLocalDateStr(orderDate) <= dateRange.end;
        
        if (!isWithinDateRange) return;
        
        if (order.status === 'delivered') {
          order.items?.forEach((item: any) => {
            const productId = String(item.productId);
            const existing = productSalesMap.get(productId);
            if (existing) {
              const itemRevenue = (item.unitPrice ?? item.price) * item.quantity;
              existing.sold += item.quantity;
              existing.revenue += itemRevenue;
            }
          });
        }
      });
      
      const stats: ProductStat[] = Array.from(productSalesMap.entries())
        .map(([id, sales]) => {
          const info = productInfoMap.get(id);
          if (info && (sales.sold > 0 || info.stock > 0)) {
            return {
              id,
              name: info.name,
              category: info.category,
              price: info.price,
              stock: info.stock,
              sold: sales.sold,
              revenue: sales.revenue,
              returned: 0
            };
          }
          return null;
        })
        .filter((item): item is ProductStat => item !== null);
      
      stats.sort((a, b) => b.sold - a.sold);
      
      setProductStats(stats);
      
      const uniqueCategories = Array.from(new Set(stats.map(p => p.category)));
      setCategories(uniqueCategories);
      
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFilterCategory(value);
  };

  const handleRefresh = () => {
    loadData();
  };

  const filteredProducts = filterCategory === 'all' 
    ? productStats 
    : productStats.filter(p => p.category === filterCategory);

  const stats = useCallback((): TotalStats => {
    const filtered = filteredProducts;
    return {
      totalProducts: filtered.length,
      totalStock: filtered.reduce((s, p) => s + p.stock, 0),
      totalRevenue: filtered.reduce((s, p) => s + p.revenue, 0),
      totalSold: filtered.reduce((s, p) => s + p.sold, 0)
    };
  }, [filteredProducts])();

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    const rows = filteredProducts.map((p) => ({
      'Product ID': p.id,
      Name: p.name,
      Category: p.category,
      Price: peso(p.price),
      'Current stock': p.stock,
      'Units sold': p.sold,
      'Revenue': peso(p.revenue)
    }));
    const name = `inventory_report_${dateRange.start}_to_${dateRange.end}`;
    if (format === 'excel') reportService.exportToExcel(rows, name);
    else if (format === 'csv') reportService.exportToCSV(rows, name);
    else reportService.exportToJSON(rows, name);
    setExportLoading(false);
  };

  const handlePrint = () => {
    const content = document.getElementById('report-print-content');
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Product Performance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .company-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
            .company-header img { width: 64px; height: 64px; object-fit: contain; }
            .company-header h1 { margin: 0; font-size: 24px; }
            .company-header p { margin: 4px 0; color: #475569; }
            .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="company-header">
            <img src="${logo}" alt="Doctama's Marketing Logo" />
            <div>
              <h1>Doctama's Marketing</h1>
              <p>Gabao, Bacon, Sorsogon City, Sorsogon, Philippines</p>
              <p>📞 +63 998 586 8888 | ✉️ support@doctama.com | 🌐 www.doctamasmarketing.com</p>
            </div>
          </div>
          <div class="summary">
            <p><strong>Period:</strong> ${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}</p>
            <p><strong>Total Products:</strong> ${stats.totalProducts}</p>
            <p><strong>Total Stock:</strong> ${stats.totalStock}</p>
            <p><strong>Total Revenue:</strong> ${peso(stats.totalRevenue)}</p>
            <p><strong>Total Units Sold:</strong> ${stats.totalSold}</p>
          </div>
          ${content.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Doctama Furniture - Product Performance Report</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
  };

  const summaryContent = (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">Product Performance Summary</p>
          <p className="text-xs text-gray-500 mt-0.5">Period: ${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">Total Revenue</p>
          <p className="text-lg font-bold text-rose-600">{peso(stats.totalRevenue)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2 border-t">
        <div>
          <p className="text-xs text-gray-400">Products</p>
          <p className="text-sm font-semibold">{stats.totalProducts}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Stock Units</p>
          <p className="text-sm font-semibold">{stats.totalStock}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Units Sold</p>
          <p className="text-sm font-semibold">{stats.totalSold}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading inventory data…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {(loading || exportLoading) && <LoadingOverlay message={loading ? "Loading inventory data..." : "Generating export file..."} />}
      
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Simple Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Performance Report</h1>
          <p className="text-sm text-gray-500 mt-1">Track product sales and inventory levels</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Category Filter</label>
              <select
                value={filterCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={exportLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {exportLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Product Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-rose-600" />
              Product Inventory
              <span className="text-xs text-gray-400 ml-2">({filteredProducts.length} items)</span>
            </h3>
            <button
              onClick={() => setShowPDFModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview Full Report
            </button>
          </div>

          <div id="report-print-content">
            <ProductTable products={filteredProducts} stats={stats} isLoading={loading} />
          </div>
        </div>

        {/* PDF Modal - Includes Company Header */}
        <PDFReportModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          title="Product Performance Report"
          onPrint={handlePrint}
          onExport={() => handleExport('excel')}
          period={`${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}`}
          summary={summaryContent}
        >
          <>
            <CompanyHeader />
            <div className="mt-6">
              <ProductTable products={filteredProducts} stats={stats} />
            </div>
          </>
        </PDFReportModal>
      </div>
    </>
  );
};

export default ProductsReport;