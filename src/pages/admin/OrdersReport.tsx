import React, { useState, useEffect, useCallback } from 'react';
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import ReportFilters from '../../components/admin/ReportFilters';
import reportService from '../../services/report.service';
import { useOrders } from '../../contexts/OrderContext';
import PDFReportModal from '../../components/admin/PDFReportModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRange {
  start: string;
  end: string;
}

interface StatusStats {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
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

const STATUS_BADGE: Record<string, string> = {
  completed:  'bg-green-100 text-green-800',
  delivered:  'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  pending:    'bg-yellow-100 text-yellow-800',
};

const statusBadge = (status: string | undefined) =>
  STATUS_BADGE[status?.toLowerCase() ?? ''] ?? 'bg-red-100 text-red-800';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, valueColor }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
    </div>
    <div className="opacity-70">{icon}</div>
  </div>
);

interface OrderTableProps {
  orders: any[];
  totalSales: number;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, totalSales }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No orders found in this date range</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Order ID', 'Date', 'Customer', 'Total', 'Status', 'Payment', 'Items'].map((h) => (
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
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusBadge(order.status)}`}>
                  {order.status ?? 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {order.paymentMethod ?? order.payment_method ?? 'N/A'}
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
            <td className="px-4 py-3 font-semibold text-gray-900">{peso(totalSales)}</td>
            <td colSpan={3} className="px-4 py-3 text-sm text-gray-500">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OrdersReport: React.FC = () => {
  const { state, getAllOrders } = useOrders();
  const { orders, loading } = state;

  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  // ── Fetch once on mount ──────────────────────────────────────────────────
  useEffect(() => {
    getAllOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter whenever orders or date range changes ─────────────────────────
  useEffect(() => {
    if (!orders?.length) {
      setFilteredOrders([]);
      return;
    }
    const filtered = orders.filter((order) => {
      const d = toDateStr(order.createdAt);
      return d && d >= dateRange.start && d <= dateRange.end;
    });
    setFilteredOrders(filtered);
  }, [orders, dateRange]);

  // ── Derived stats (memoised) ─────────────────────────────────────────────
  const statusStats = useCallback((): StatusStats => {
    const s = { pending: 0, processing: 0, completed: 0, cancelled: 0 };
    filteredOrders.forEach((order) => {
      switch (order.status?.toLowerCase()) {
        case 'pending':    s.pending++;    break;
        case 'processing': s.processing++; break;
        case 'completed':
        case 'delivered':  s.completed++;  break;
        case 'cancelled':
        case 'canceled':   s.cancelled++;  break;
      }
    });
    return s;
  }, [filteredOrders])();

  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  // ── Export ───────────────────────────────────────────────────────────────
  const buildRows = () =>
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
    const rows = buildRows();
    const name = `orders_report_${dateRange.start}_to_${dateRange.end}`;
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
    document.title = 'Orders Report';
    win.document.write(`
      <html>
        <head>
          <title>Orders Report</title>
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
        <p className="text-sm font-medium text-gray-800">Orders summary</p>
        <p className="text-xs text-gray-500 mt-0.5">Total orders: {filteredOrders.length}</p>
        <p className="text-xs text-gray-500">Total sales: {peso(totalSales)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-800">Breakdown</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Pending: {statusStats.pending} · Processing: {statusStats.processing}
        </p>
        <p className="text-xs text-gray-500">
          Completed: {statusStats.completed} · Cancelled: {statusStats.cancelled}
        </p>
      </div>
    </div>
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading orders…</p>
        </div>
      </div>
    );
  }

  const iconSize = 'w-8 h-8';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders report</h1>
        <p className="text-sm text-gray-500 mt-1">View and export order details</p>
      </div>

      {/* Filters */}
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        onPrint={handlePrint}
        loading={exportLoading}
      />

      {/* Status stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending orders"
          value={statusStats.pending}
          icon={<Clock className={`${iconSize} text-yellow-500`} />}
          valueColor="text-yellow-600"
        />
        <StatCard
          label="Processing"
          value={statusStats.processing}
          icon={<Package className={`${iconSize} text-blue-500`} />}
          valueColor="text-blue-600"
        />
        <StatCard
          label="Completed"
          value={statusStats.completed}
          icon={<CheckCircle className={`${iconSize} text-green-500`} />}
          valueColor="text-green-600"
        />
        <StatCard
          label="Cancelled"
          value={statusStats.cancelled}
          icon={<XCircle className={`${iconSize} text-red-500`} />}
          valueColor="text-red-600"
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
          <OrderTable orders={filteredOrders} totalSales={totalSales} />
        </div>
      </div>

      {/* PDF modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Orders Report"
        onPrint={handlePrint}
        onExport={() => handleExport('excel')}
        period={`${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}`}
        summary={summaryContent}
      >
        <OrderTable orders={filteredOrders} totalSales={totalSales} />
      </PDFReportModal>
    </div>
  );
};

export default OrdersReport;