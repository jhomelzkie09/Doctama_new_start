import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Eye, Download, Printer, Calendar, Filter, BarChart3, Package, AlertTriangle } from 'lucide-react';
import ReportFilters from '../../components/admin/ReportFilters';
import reportService from '../../services/report.service';
import { useOrders } from '../../contexts/OrderContext';
import PDFReportModal from '../../components/admin/PDFReportModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRange {
  start: string;
  end: string;
}

interface ReportStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
  dailySales: Array<{ date: string; sales: number; orders: number }>;
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

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusClass = (status: string | undefined) =>
  STATUS_STYLES[status?.toLowerCase() ?? ''] ?? 'bg-gray-100 text-gray-800';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-rose-50 rounded-lg">{icon}</div>
      {trend && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

interface TopProductsProps {
  products: Array<{ name: string; sold: number; revenue: number }>;
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  if (products.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-rose-600" />
        Top Selling Products
      </h3>
      <div className="space-y-3">
        {products.slice(0, 5).map((product, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 w-6">#{idx + 1}</span>
              <span className="text-sm text-gray-800">{product.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-gray-600">{product.sold} sold</span>
              <span className="text-xs text-gray-400 ml-2">{peso(product.revenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DailySalesChartProps {
  data: Array<{ date: string; sales: number; orders: number }>;
}

const DailySalesChart: React.FC<DailySalesChartProps> = ({ data }) => {
  if (data.length === 0) return null;
  
  const maxSales = Math.max(...data.map(d => d.sales));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-rose-600" />
        Daily Sales Trend
      </h3>
      <div className="space-y-3">
        {data.slice(-7).map((day, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{new Date(day.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
              <span className="font-medium text-gray-700">{peso(day.sales)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(day.sales / maxSales) * 100}%` }}
              />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400">{day.orders} orders</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ReportTableProps {
  orders: any[];
  stats: ReportStats;
}

const ReportTable: React.FC<ReportTableProps> = ({ orders, stats }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No sales found in this date range</p>
        <p className="text-xs mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Order ID', 'Date', 'Customer', 'Total', 'Status', 'Payment Method', 'Items'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">
                #{order.orderNumber?.slice(-8) ?? order.id?.toString().slice(-6)}
              </td>
              <td className="px-4 py-3 text-gray-600">{toDisplayDate(order.orderDate ?? order.createdAt)}</td>
              <td className="px-4 py-3 text-gray-900">
                {order.customerName ?? order.user?.fullName ?? 'Guest'}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{peso(order.totalAmount ?? order.total ?? 0)}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusClass(order.status)}`}>
                  {order.status ?? 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 capitalize">{order.paymentMethod ?? 'N/A'}</td>
              <td className="px-4 py-3 text-gray-600">{order.items?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200">
            <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-600">
              Total
            </td>
            <td className="px-4 py-3 font-bold text-gray-900">{peso(stats.totalSales)}</td>
            <td colSpan={3} className="px-4 py-3 text-sm text-gray-500">
              {stats.totalOrders} order{stats.totalOrders !== 1 ? 's' : ''} · {stats.uniqueCustomers} customer{stats.uniqueCustomers !== 1 ? 's' : ''}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalesReport: React.FC = () => {
  const { state, getAllOrders } = useOrders();
  const { orders, loading } = state;

  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    getAllOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const d = toLocalDateStr(order.orderDate ?? order.createdAt);
      return d && d >= dateRange.start && d <= dateRange.end;
    });
    setFilteredOrders(filtered);
  }, [orders, dateRange]);

  const stats = useCallback((): ReportStats => {
    const totalSales = filteredOrders.reduce((s, o) => s + (o.totalAmount ?? o.total ?? 0), 0);
    const totalOrders = filteredOrders.length;
    
    // Calculate top products
    const productSales = new Map<string, { sold: number; revenue: number }>();
    filteredOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        const existing = productSales.get(item.productName);
        if (existing) {
          existing.sold += item.quantity;
          existing.revenue += (item.unitPrice ?? item.price) * item.quantity;
        } else {
          productSales.set(item.productName, {
            sold: item.quantity,
            revenue: (item.unitPrice ?? item.price) * item.quantity
          });
        }
      });
    });
    
    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, sold: data.sold, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue);
    
    // Calculate daily sales
    const dailyMap = new Map<string, { sales: number; orders: number }>();
    filteredOrders.forEach(order => {
      const date = toLocalDateStr(order.orderDate ?? order.createdAt);
      if (date) {
        const existing = dailyMap.get(date);
        if (existing) {
          existing.sales += order.totalAmount ?? order.total ?? 0;
          existing.orders += 1;
        } else {
          dailyMap.set(date, {
            sales: order.totalAmount ?? order.total ?? 0,
            orders: 1
          });
        }
      }
    });
    
    const dailySales = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, sales: data.sales, orders: data.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      uniqueCustomers: new Set(filteredOrders.map(o => o.customerEmail ?? o.userId)).size,
      topProducts,
      dailySales
    };
  }, [filteredOrders])();

  const buildExportRows = () =>
    filteredOrders.map((order) => ({
      'Order ID': order.orderNumber ?? order.id,
      Date: toDisplayDate(order.orderDate ?? order.createdAt),
      Customer: order.customerName ?? 'Guest',
      Email: order.customerEmail ?? 'N/A',
      Total: peso(order.totalAmount ?? order.total ?? 0),
      Status: order.status ?? 'N/A',
      'Payment Method': order.paymentMethod ?? 'N/A',
      Items: order.items?.length ?? 0,
    }));

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    const rows = buildExportRows();
    const name = `sales_report_${dateRange.start}_to_${dateRange.end}`;
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
    const prev = document.title;
    document.title = `Sales Report ${dateRange.start} to ${dateRange.end}`;
    win.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Sales Performance Report</h1>
          <div class="summary">
            <p><strong>Period:</strong> ${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}</p>
            <p><strong>Total Sales:</strong> ${peso(stats.totalSales)}</p>
            <p><strong>Total Orders:</strong> ${stats.totalOrders}</p>
            <p><strong>Average Order Value:</strong> ${peso(stats.averageOrderValue)}</p>
            <p><strong>Unique Customers:</strong> ${stats.uniqueCustomers}</p>
          </div>
          ${content.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Doctama Furniture - Official Sales Report</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    document.title = prev;
  };

  const summaryContent = (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">Sales Summary</p>
          <p className="text-xs text-gray-500 mt-0.5">Period: {toDisplayDate(dateRange.start)} – {toDisplayDate(dateRange.end)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">Total Revenue</p>
          <p className="text-lg font-bold text-rose-600">{peso(stats.totalSales)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2 border-t">
        <div>
          <p className="text-xs text-gray-400">Orders</p>
          <p className="text-sm font-semibold">{stats.totalOrders}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Avg. Order</p>
          <p className="text-sm font-semibold">{peso(Math.round(stats.averageOrderValue))}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Customers</p>
          <p className="text-sm font-semibold">{stats.uniqueCustomers}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading sales data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Performance Report</h1>
        <p className="text-sm text-gray-500 mt-1">Track revenue, orders, and sales trends over time</p>
      </div>

      {/* Filters */}
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        onPrint={handlePrint}
        loading={exportLoading}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sales"
          value={peso(stats.totalSales)}
          icon={<DollarSign className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Average Order Value"
          value={peso(Math.round(stats.averageOrderValue))}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          label="Unique Customers"
          value={String(stats.uniqueCustomers)}
          icon={<Users className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailySalesChart data={stats.dailySales} />
        <TopProducts products={stats.topProducts} />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">Order Details</h3>
          <button
            onClick={() => setShowPDFModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview PDF Report
          </button>
        </div>

        <div id="report-print-content">
          <ReportTable orders={filteredOrders} stats={stats} />
        </div>
      </div>

      {/* PDF Modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Sales Performance Report"
        onPrint={handlePrint}
        onExport={() => handleExport('excel')}
        period={`${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}`}
        summary={summaryContent}
      >
        <ReportTable orders={filteredOrders} stats={stats} />
      </PDFReportModal>
    </div>
  );
};

export default SalesReport;