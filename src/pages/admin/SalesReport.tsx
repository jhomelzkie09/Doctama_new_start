import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Eye, Download, Printer } from 'lucide-react';
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateStr = (value: string | Date | undefined): string => {
  if (!value) return '';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const toDisplayDate = (value: string | Date | undefined): string => {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

const peso = (n: number) => `₱${n.toLocaleString()}`;

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

const statusClass = (status: string | undefined) =>
  STATUS_STYLES[status ?? ''] ?? 'bg-red-100 text-red-800';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
    <div className={`${iconBg} p-3 rounded-full ${iconColor}`}>{icon}</div>
  </div>
);

interface ReportTableProps {
  orders: any[];
  stats: ReportStats;
}

const ReportTable: React.FC<ReportTableProps> = ({ orders, stats }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No orders found in this date range</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Order ID', 'Date', 'Customer', 'Total', 'Status', 'Items'].map((h) => (
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
                #{order.id?.toString().slice(-6) ?? 'N/A'}
              </td>
              <td className="px-4 py-3 text-gray-600">{toDisplayDate(order.createdAt)}</td>
              <td className="px-4 py-3 text-gray-900">
                {order.user?.fullName ?? order.user?.name ?? order.customerName ?? 'Guest'}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{peso(order.total ?? 0)}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusClass(order.status)}`}>
                  {order.status ?? 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{order.items?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200">
            <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-600">
              Total
            </td>
            <td className="px-4 py-3 font-semibold text-gray-900">{peso(stats.totalSales)}</td>
            <td colSpan={2} className="px-4 py-3 text-sm text-gray-500">
              {stats.totalOrders} order{stats.totalOrders !== 1 ? 's' : ''}
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
      const d = toDateStr(order.createdAt);
      return d && d >= dateRange.start && d <= dateRange.end;
    });
    setFilteredOrders(filtered);
  }, [orders, dateRange]);

  const stats = useCallback((): ReportStats => {
    const totalSales = filteredOrders.reduce((s, o) => s + (o.total ?? 0), 0);
    const totalOrders = filteredOrders.length;
    return {
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      uniqueCustomers: new Set(filteredOrders.map((o) => o.userId ?? o.user?.id)).size,
    };
  }, [filteredOrders])();

  const buildExportRows = () =>
    filteredOrders.map((order) => ({
      'Order ID': order.id ?? 'N/A',
      Date: toDisplayDate(order.createdAt),
      Customer: order.user?.fullName ?? order.user?.name ?? order.customerName ?? 'Guest',
      Total: peso(order.total ?? 0),
      Status: order.status ?? 'N/A',
      'Payment Method': order.paymentMethod ?? order.payment_method ?? 'N/A',
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
    document.title = 'Sales Report';
    win.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
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

  const summaryContent = (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-800">Sales summary</p>
        <p className="text-xs text-gray-500 mt-0.5">Total revenue: {peso(stats.totalSales)}</p>
        <p className="text-xs text-gray-500">Total orders: {stats.totalOrders}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-800">Average order</p>
        <p className="text-xs text-gray-500 mt-0.5">{peso(stats.averageOrderValue)}</p>
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

  const iconSize = 'w-5 h-5';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Sales report</h1>
        <p className="text-sm text-gray-500 mt-1">View and export sales data</p>
      </div>

      {/* Filters */}
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        onPrint={handlePrint}
        loading={exportLoading}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total sales"
          value={peso(stats.totalSales)}
          icon={<DollarSign className={iconSize} />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label="Total orders"
          value={String(stats.totalOrders)}
          icon={<ShoppingBag className={iconSize} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Avg. order value"
          value={peso(Math.round(stats.averageOrderValue))}
          icon={<TrendingUp className={iconSize} />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Unique customers"
          value={String(stats.uniqueCustomers)}
          icon={<Users className={iconSize} />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-gray-100 flex justify-end">
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
          <ReportTable orders={filteredOrders} stats={stats} />
        </div>
      </div>

      {/* PDF modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Sales Report"
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