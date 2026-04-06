import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertCircle, DollarSign, TrendingUp, Eye } from 'lucide-react';
import reportService from '../../services/report.service';
import productService from '../../services/product.service';
import PDFReportModal from '../../components/admin/PDFReportModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductStat {
  id: string | number;
  name: string;
  category: string | number;
  price: number;
  stock: number;
  sold: number;
  revenue: number;
}

interface TotalStats {
  totalProducts: number;
  totalStock: number;
  totalRevenue: number;
  totalSold: number;
  lowStock: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const peso = (n: number) => `₱${n.toLocaleString()}`;

const stockStatus = (stock: number): { label: string; className: string } => {
  if (stock === 0) return { label: 'Out of stock', className: 'bg-red-100 text-red-800' };
  if (stock < 10)  return { label: 'Low stock',    className: 'bg-yellow-100 text-yellow-800' };
  return              { label: 'In stock',       className: 'bg-green-100 text-green-800' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, valueColor = 'text-gray-900' }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
    </div>
    <div className="opacity-70">{icon}</div>
  </div>
);

interface ProductTableProps {
  products: ProductStat[];
  stats: TotalStats;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, stats }) => {
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
            {['Product name', 'Category', 'Price', 'Stock', 'Sold', 'Revenue', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {products.map((product) => {
            const status = stockStatus(product.stock);
            return (
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
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200">
            <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-gray-600">
              Totals
            </td>
            <td className="px-4 py-3 text-gray-400">—</td>
            <td className="px-4 py-3 font-semibold text-gray-900">{stats.totalStock}</td>
            <td className="px-4 py-3 font-semibold text-gray-900">{stats.totalSold}</td>
            <td className="px-4 py-3 font-semibold text-gray-900">{peso(stats.totalRevenue)}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{stats.lowStock} low stock</td>
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

  // ── Fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allProducts = await productService.getProducts();
        const stats: ProductStat[] = allProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.categoryId,
          price: p.price,
          stock: p.stockQuantity ?? 0,
          // TODO: replace with real sales data from your API
          sold: Math.floor(Math.random() * 100),
          revenue: p.price * Math.floor(Math.random() * 100),
        }));
        setProductStats(stats);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived totals (memoised) ────────────────────────────────────────────
  const stats = useCallback((): TotalStats => ({
    totalProducts: productStats.length,
    totalStock:    productStats.reduce((s, p) => s + p.stock, 0),
    totalRevenue:  productStats.reduce((s, p) => s + p.revenue, 0),
    totalSold:     productStats.reduce((s, p) => s + p.sold, 0),
    lowStock:      productStats.filter((p) => p.stock < 10).length,
  }), [productStats])();

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    const rows = productStats.map((p) => ({
      'Product ID': p.id,
      Name: p.name,
      Category: p.category,
      Price: peso(p.price),
      'Current stock': p.stock,
      'Units sold': p.sold,
      Revenue: peso(p.revenue),
      Status: stockStatus(p.stock).label,
    }));
    const name = `products_report_${new Date().toISOString().split('T')[0]}`;
    if (format === 'excel') reportService.exportToExcel(rows, name);
    else if (format === 'csv') reportService.exportToCSV(rows, name);
    else reportService.exportToJSON(rows, name);
    setExportLoading(false);
  };

  // ── Print ────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = document.getElementById('report-print-content');
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const prev = document.title;
    document.title = 'Products Report';
    win.document.write(`
      <html>
        <head>
          <title>Products Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    document.title = prev;
  };

  // ── PDF modal summary ────────────────────────────────────────────────────
  const summaryContent = (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-800">Inventory summary</p>
        <p className="text-xs text-gray-500 mt-0.5">Total products: {stats.totalProducts}</p>
        <p className="text-xs text-gray-500">Total stock: {stats.totalStock}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-800">Sales summary</p>
        <p className="text-xs text-gray-500 mt-0.5">Units sold: {stats.totalSold}</p>
        <p className="text-xs text-gray-500">Total revenue: {peso(stats.totalRevenue)}</p>
        <p className="text-xs text-red-500">Low stock items: {stats.lowStock}</p>
      </div>
    </div>
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading products…</p>
        </div>
      </div>
    );
  }

  const iconSize = 'w-8 h-8';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Products report</h1>
        <p className="text-sm text-gray-500 mt-1">View and export product inventory and sales data</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total products"
          value={stats.totalProducts}
          icon={<Package className={`${iconSize} text-blue-500`} />}
        />
        <StatCard
          label="Total stock"
          value={stats.totalStock}
          icon={<TrendingUp className={`${iconSize} text-green-500`} />}
        />
        <StatCard
          label="Total revenue"
          value={peso(stats.totalRevenue)}
          icon={<DollarSign className={`${iconSize} text-yellow-500`} />}
        />
        <StatCard
          label="Low stock items"
          value={stats.lowStock}
          icon={<AlertCircle className={`${iconSize} text-red-500`} />}
          valueColor="text-red-600"
        />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            {(['excel', 'csv', 'json'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={exportLoading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPDFModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview PDF
          </button>
        </div>

        {/* Printable content */}
        <div id="report-print-content">
          <ProductTable products={productStats} stats={stats} />
        </div>
      </div>

      {/* PDF modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Products Report"
        onPrint={handlePrint}
        onExport={() => handleExport('excel')}
        period="Current inventory"
        summary={summaryContent}
      >
        <ProductTable products={productStats} stats={stats} />
      </PDFReportModal>
    </div>
  );
};

export default ProductsReport;