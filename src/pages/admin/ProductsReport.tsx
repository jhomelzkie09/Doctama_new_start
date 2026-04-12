import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertCircle, DollarSign, TrendingUp, Eye, RefreshCw, ArrowLeftRight, Clock, CheckCircle, XCircle, AlertTriangle, Download, Printer, Filter } from 'lucide-react';
import reportService from '../../services/report.service';
import productService from '../../services/product.service';
import orderService from '../../services/order.service';
import PDFReportModal from '../../components/admin/PDFReportModal';

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

interface ReturnedProduct {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  reason: string;
  returnDate: string;
  status: 'pending' | 'approved' | 'rejected';
  customerName: string;
  refundAmount: number;
}

interface TotalStats {
  totalProducts: number;
  totalStock: number;
  totalRevenue: number;
  totalSold: number;
  lowStock: number;
  outOfStock: number;
  totalReturned: number;
  totalRefundAmount: number;
  pendingReturns: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toLocalDateStr = (value: string | Date | undefined): string => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
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

const stockStatus = (stock: number): { label: string; className: string; icon: React.ReactNode } => {
  if (stock === 0) return { 
    label: 'Out of stock', 
    className: 'bg-red-100 text-red-800',
    icon: <XCircle className="w-3 h-3" />
  };
  if (stock < 10) return { 
    label: 'Low stock', 
    className: 'bg-yellow-100 text-yellow-800',
    icon: <AlertTriangle className="w-3 h-3" />
  };
  return { 
    label: 'In stock', 
    className: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-3 h-3" />
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, valueColor = 'text-gray-900' }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-rose-50 rounded-lg">{icon}</div>
      {trend && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
  </div>
);

interface LowStockAlertProps {
  products: ProductStat[];
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ products }) => {
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  
  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">All products have healthy stock levels</p>
            <p className="text-xs text-green-600 mt-0.5">No low stock alerts at this time</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <h3 className="text-sm font-semibold text-yellow-800">Low Stock Alerts</h3>
          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full ml-2">
            {lowStockProducts.length + outOfStockProducts.length} items need attention
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {outOfStockProducts.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-medium text-red-600 mb-2">Out of Stock (Need Immediate Restocking)</p>
            <div className="space-y-2">
              {outOfStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span className="text-sm text-gray-800">{product.name}</span>
                  </div>
                  <span className="text-xs font-medium text-red-600">0 left</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {lowStockProducts.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-medium text-yellow-600 mb-2">Low Stock (Less than 10 units)</p>
            <div className="space-y-2">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    <span className="text-sm text-gray-800">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-yellow-500 h-1.5 rounded-full"
                        style={{ width: `${(product.stock / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-yellow-600">{product.stock} left</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReturnedProductsTableProps {
  returns: ReturnedProduct[];
}

const ReturnedProductsTable: React.FC<ReturnedProductsTableProps> = ({ returns }) => {
  if (returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <ArrowLeftRight className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No returned products in this period</p>
        <p className="text-xs mt-1">Returns will appear here when customers return items</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Return Date', 'Order #', 'Product', 'Customer', 'Quantity', 'Reason', 'Status', 'Refund Amount'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {returns.map((ret) => (
            <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600">{toDisplayDate(ret.returnDate)}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">#{ret.orderNumber}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{ret.productName}</td>
              <td className="px-4 py-3 text-gray-600">{ret.customerName}</td>
              <td className="px-4 py-3 text-gray-600">{ret.quantity}</td>
              <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={ret.reason}>
                {ret.reason}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  ret.status === 'approved' ? 'bg-green-100 text-green-800' :
                  ret.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {ret.status}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-red-600">{peso(ret.refundAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
            {['Product name', 'Category', 'Price', 'Stock', 'Sold', 'Returned', 'Net Sales', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product) => {
            const status = stockStatus(product.stock);
            const netSales = product.revenue - (product.returned * product.price);
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
                <td className="px-4 py-3">
                  {product.returned > 0 ? (
                    <span className="text-orange-600 font-medium">{product.returned}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{peso(netSales)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium ${status.className}`}>
                    {status.icon}
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
            <td className="px-4 py-3 font-semibold text-orange-600">{stats.totalReturned}</td>
            <td className="px-4 py-3 font-semibold text-gray-900">{peso(stats.totalRevenue - (stats.totalReturned * (stats.totalRevenue / stats.totalSold) || 0))}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{stats.lowStock + stats.outOfStock} need attention</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductsReport: React.FC = () => {
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [returnedProducts, setReturnedProducts] = useState<ReturnedProduct[]>([]);
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
      
      // Calculate product stats from actual orders
      const productSalesMap = new Map<number, { sold: number; revenue: number; returned: number }>();
      const productInfoMap = new Map<number, { name: string; category: string; price: number; stock: number }>();
      
      // Initialize with product info
      allProducts.forEach((p: any) => {
        productInfoMap.set(p.id, {
          name: p.name,
          category: p.categoryName || `Category ${p.categoryId}`,
          price: p.price,
          stock: p.stockQuantity ?? 0
        });
        productSalesMap.set(p.id, { sold: 0, revenue: 0, returned: 0 });
      });
      
      // Calculate sales and returns from orders within date range
      const returnsList: ReturnedProduct[] = [];
      const refundMap = new Map<number, { productId: number; quantity: number; refundAmount: number; reason: string; orderNumber: string; customerName: string }>();
      
      allOrders.forEach((order: any) => {
        const orderDate = order.orderDate ?? order.createdAt;
        const isWithinDateRange = orderDate && toLocalDateStr(orderDate) >= dateRange.start && toLocalDateStr(orderDate) <= dateRange.end;
        
        // Process regular orders (completed/delivered)
        if (isWithinDateRange && (order.status === 'delivered' || order.status === 'completed')) {
          order.items?.forEach((item: any) => {
            const existing = productSalesMap.get(item.productId);
            if (existing) {
              existing.sold += item.quantity;
              existing.revenue += (item.unitPrice ?? item.price) * item.quantity;
            }
          });
        }
        
        // Process cancelled/refunded orders (these count as returns)
        if (isWithinDateRange && order.status === 'cancelled' && order.paymentStatus === 'refunded') {
          order.items?.forEach((item: any) => {
            const existing = productSalesMap.get(item.productId);
            if (existing) {
              existing.returned += item.quantity;
              
              // Add to returns list
              returnsList.push({
                id: `RET-${order.id}-${item.productId}-${Date.now()}`,
                orderNumber: order.orderNumber,
                productName: item.productName,
                quantity: item.quantity,
                reason: order.rejectionReason || 'Order cancelled and refunded',
                returnDate: order.updatedAt || order.orderDate,
                status: 'approved',
                customerName: order.customerName || 'Guest',
                refundAmount: (item.unitPrice ?? item.price) * item.quantity
              });
            }
          });
        }
      });
      
      // Build product stats
      const stats: ProductStat[] = Array.from(productSalesMap.entries()).map(([id, sales]) => {
        const info = productInfoMap.get(id)!;
        return {
          id,
          name: info.name,
          category: info.category,
          price: info.price,
          stock: info.stock,
          sold: sales.sold,
          revenue: sales.revenue,
          returned: sales.returned
        };
      }).filter(p => p.sold > 0 || p.stock > 0 || p.returned > 0);
      
      setProductStats(stats);
      setReturnedProducts(returnsList);
      
      // Extract unique categories
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

  // ── Filter products by category ─────────────────────────────────────────────
  const filteredProducts = filterCategory === 'all' 
    ? productStats 
    : productStats.filter(p => p.category === filterCategory);

  // ── Derived totals ──────────────────────────────────────────────────────────
  const stats = useCallback((): TotalStats => {
    const filtered = filteredProducts;
    const totalReturned = returnedProducts.reduce((sum, r) => sum + r.quantity, 0);
    const totalRefundAmount = returnedProducts.reduce((sum, r) => sum + r.refundAmount, 0);
    const pendingReturns = returnedProducts.filter(r => r.status === 'pending').length;
    
    return {
      totalProducts: filtered.length,
      totalStock: filtered.reduce((s, p) => s + p.stock, 0),
      totalRevenue: filtered.reduce((s, p) => s + p.revenue, 0),
      totalSold: filtered.reduce((s, p) => s + p.sold, 0),
      lowStock: filtered.filter((p) => p.stock > 0 && p.stock < 10).length,
      outOfStock: filtered.filter((p) => p.stock === 0).length,
      totalReturned,
      totalRefundAmount,
      pendingReturns
    };
  }, [filteredProducts, returnedProducts])();

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    const rows = filteredProducts.map((p) => ({
      'Product ID': p.id,
      Name: p.name,
      Category: p.category,
      Price: peso(p.price),
      'Current stock': p.stock,
      'Units sold': p.sold,
      'Units returned': p.returned,
      'Net Revenue': peso(p.revenue - (p.returned * p.price)),
      Status: stockStatus(p.stock).label,
    }));
    const name = `inventory_report_${dateRange.start}_to_${dateRange.end}`;
    if (format === 'excel') reportService.exportToExcel(rows, name);
    else if (format === 'csv') reportService.exportToCSV(rows, name);
    else reportService.exportToJSON(rows, name);
    setExportLoading(false);
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = document.getElementById('report-print-content');
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .alert { margin: 15px 0; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Inventory & Returns Report</h1>
          <div class="summary">
            <p><strong>Period:</strong> ${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}</p>
            <p><strong>Total Products:</strong> ${stats.totalProducts}</p>
            <p><strong>Total Stock:</strong> ${stats.totalStock}</p>
            <p><strong>Total Revenue:</strong> ${peso(stats.totalRevenue)}</p>
            <p><strong>Total Returns:</strong> ${stats.totalReturned} (${peso(stats.totalRefundAmount)})</p>
          </div>
          ${stats.lowStock + stats.outOfStock > 0 ? `
            <div class="alert">
              <strong>⚠️ Inventory Alert:</strong> ${stats.lowStock} products low stock, ${stats.outOfStock} out of stock
            </div>
          ` : ''}
          ${content.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Doctama Furniture - Inventory & Returns Report</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
  };

  // ── PDF modal summary ──────────────────────────────────────────────────────
  const summaryContent = (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">Inventory Summary</p>
          <p className="text-xs text-gray-500 mt-0.5">Period: {toDisplayDate(dateRange.start)} – {toDisplayDate(dateRange.end)}</p>
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
      <div className="border-t pt-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Returns:</span>
          <span className="font-medium text-orange-600">{stats.totalReturned} units</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">Refund Amount:</span>
          <span className="font-medium text-red-600">{peso(stats.totalRefundAmount)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">Pending Returns:</span>
          <span className="font-medium text-yellow-600">{stats.pendingReturns}</span>
        </div>
      </div>
    </div>
  );

  // ── Loading state ──────────────────────────────────────────────────────────
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Returns Report</h1>
        <p className="text-sm text-gray-500 mt-1">Track stock levels, product performance, and returned items</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Category Filter</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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
              onClick={() => loadData()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exportLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={stats.totalProducts}
          icon={<Package className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Total Stock"
          value={stats.totalStock}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Total Revenue"
          value={peso(stats.totalRevenue)}
          icon={<DollarSign className="w-5 h-5 text-yellow-600" />}
        />
        <StatCard
          label="Returns"
          value={`${stats.totalReturned} (${peso(stats.totalRefundAmount)})`}
          icon={<ArrowLeftRight className="w-5 h-5 text-orange-600" />}
          valueColor="text-orange-600"
        />
      </div>

      {/* Low Stock Alert */}
      <LowStockAlert products={filteredProducts} />

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
          <ProductTable products={filteredProducts} stats={stats} />
        </div>
      </div>

      {/* Returned Products Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-800">Returned Products</h3>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full ml-2">
              {stats.totalReturned} units returned
            </span>
          </div>
        </div>
        <ReturnedProductsTable returns={returnedProducts} />
      </div>

      {/* PDF Modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Inventory & Returns Report"
        onPrint={handlePrint}
        onExport={() => handleExport('excel')}
        period={`${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}`}
        summary={summaryContent}
      >
        <>
          <LowStockAlert products={filteredProducts} />
          <ProductTable products={filteredProducts} stats={stats} />
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Returned Products</h3>
            <ReturnedProductsTable returns={returnedProducts} />
          </div>
        </>
      </PDFReportModal>
    </div>
  );
};

export default ProductsReport;