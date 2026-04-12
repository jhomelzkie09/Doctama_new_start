import React, { useState, useEffect, useCallback } from 'react';
import { Package, Clock, CheckCircle, XCircle, Eye, Search, Loader, RefreshCw } from 'lucide-react';
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

const resolveOrderDate = (order: any): string | Date | undefined =>
  order.orderDate ?? order.createdAt ?? order.updatedAt;

const resolveOrderTotal = (order: any): number =>
  order.totalAmount ?? order.total ?? 0;

const toLocalDateStr = (value: string | Date | undefined): string => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
};

const toDisplayDate = (value: string | Date | undefined): string => {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

const peso = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_CONFIG: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  completed:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  pending:    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
};

const getStatusConfig = (status: string | undefined) =>
  STATUS_CONFIG[status?.toLowerCase() ?? ''] ?? { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  themeColor: 'yellow' | 'blue' | 'green' | 'red';
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, themeColor, isLoading }) => {
  const colorMap = {
    yellow: 'text-amber-600 bg-amber-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    red: 'text-rose-600 bg-rose-50',
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
        </div>
        <div className="p-4 rounded-xl bg-gray-100">
          <div className="w-7 h-7 text-gray-300">{icon}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${colorMap[themeColor]} bg-opacity-60`}>
        {icon}
      </div>
    </div>
  );
};

interface OrderTableProps {
  orders: any[];
  totalSales: number;
  isLoading?: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, totalSales, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-400">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 m-4">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-base font-medium text-gray-900">No orders found</p>
        <p className="text-sm mt-1 text-gray-500">Try adjusting your date range to see more results.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            {['Order ID', 'Date', 'Customer', 'Total', 'Status', 'Payment', 'Items'].map((h, i) => (
              <th 
                key={h} 
                className={`px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 3 ? 'text-right' : 'text-left'}`}
              >
                {h}
              </th>
            ))}
           </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {orders.map((order) => {
            const customerName = order.customerName ?? order.user?.fullName ?? order.user?.name ?? 'Guest';
            const initial = customerName.charAt(0).toUpperCase();
            const statusStyle = getStatusConfig(order.status);

            return (
              <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-mono text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md inline-block">
                    #{order.id?.toString().slice(-6) ?? 'N/A'}
                  </div>
                 </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                  {toDisplayDate(resolveOrderDate(order))}
                 </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm">
                      {initial}
                    </div>
                    <span className="font-medium text-gray-900">{customerName}</span>
                  </div>
                 </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="font-semibold text-gray-900">{peso(resolveOrderTotal(order))}</span>
                 </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                    <span className="capitalize">{order.status ?? 'N/A'}</span>
                  </span>
                 </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">
                  {order.paymentMethod ?? order.payment_method ?? 'N/A'}
                 </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    {order.items?.length ?? 0}
                  </span>
                 </td>
               </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-gray-50/80 border-t-2 border-gray-100">
            <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
              Total Sales Period
             </td>
            <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">
              {peso(totalSales)}
             </td>
            <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-500">
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
  const { orders, loading: ordersLoading } = state;

  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    getAllOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter orders when date range changes
  useEffect(() => {
    const applyFilter = async () => {
      if (!orders?.length) {
        setFilteredOrders([]);
        return;
      }
      
      setIsFiltering(true);
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filtered = orders.filter((order) => {
        const d = toLocalDateStr(resolveOrderDate(order));
        return d ? d >= dateRange.start && d <= dateRange.end : false;
      });
      setFilteredOrders(filtered);
      setIsFiltering(false);
    };
    
    applyFilter();
  }, [orders, dateRange]);

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

  const totalSales = filteredOrders.reduce((sum, o) => sum + resolveOrderTotal(o), 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await getAllOrders();
    setIsRefreshing(false);
  };

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    const rows = filteredOrders.map((order) => ({
      'Order ID': order.id ?? 'N/A',
      Date: toDisplayDate(resolveOrderDate(order)),
      Customer: order.customerName ?? order.user?.fullName ?? order.user?.name ?? 'Guest',
      Total: peso(resolveOrderTotal(order)),
      Status: order.status ?? 'N/A',
      'Payment Method': order.paymentMethod ?? order.payment_method ?? 'N/A',
      Items: order.items?.length ?? 0,
    }));
    const name = `orders_report_${dateRange.start}_to_${dateRange.end}`;
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
    document.title = 'Orders Report';
    win.document.write(`
      <html>
        <head>
          <title>Orders Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; color: #111827; }
            h2 { color: #111827; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 12px 8px; text-align: left; }
            th { background: #f9fafb; font-weight: 600; color: #4b5563; font-size: 14px; }
            td { font-size: 14px; }
            .text-right { text-align: right; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h2>Orders Report</h2>
          ${content.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
    document.title = prev;
  };

  const summaryContent = (
    <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
      <div>
        <p className="text-sm font-semibold text-gray-900">Orders Summary</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">Total orders: <span className="font-medium text-gray-900">{filteredOrders.length}</span></p>
          <p className="text-sm text-gray-600">Total sales: <span className="font-medium text-gray-900">{peso(totalSales)}</span></p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">Status Breakdown</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">
            Pending: <span className="font-medium text-gray-900">{statusStats.pending}</span> · Processing: <span className="font-medium text-gray-900">{statusStats.processing}</span>
          </p>
          <p className="text-sm text-gray-600">
            Completed: <span className="font-medium text-gray-900">{statusStats.completed}</span> · Cancelled: <span className="font-medium text-gray-900">{statusStats.cancelled}</span>
          </p>
        </div>
      </div>
    </div>
  );

  // Main loading state
  if (ordersLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">Loading order data…</p>
      </div>
    );
  }

  const iconSize = 'w-7 h-7';

  return (
    <>
      {/* Loading Overlays */}
      {isFiltering && <LoadingOverlay message="Filtering orders..." />}
      {exportLoading && <LoadingOverlay message="Generating export file..." />}
      {isRefreshing && <LoadingOverlay message="Refreshing data..." />}
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Orders Report</h1>
            <p className="text-base text-gray-500 mt-1">Monitor your sales performance and order fulfillments.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <ReportFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExport={handleExport}
            onPrint={handlePrint}
            loading={exportLoading}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Pending Orders"
            value={statusStats.pending}
            icon={<Clock className={iconSize} />}
            themeColor="yellow"
            isLoading={isFiltering}
          />
          <StatCard
            label="Processing"
            value={statusStats.processing}
            icon={<Package className={iconSize} />}
            themeColor="blue"
            isLoading={isFiltering}
          />
          <StatCard
            label="Completed"
            value={statusStats.completed}
            icon={<CheckCircle className={iconSize} />}
            themeColor="green"
            isLoading={isFiltering}
          />
          <StatCard
            label="Cancelled"
            value={statusStats.cancelled}
            icon={<XCircle className={iconSize} />}
            themeColor="red"
            isLoading={isFiltering}
          />
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <button
              onClick={() => setShowPDFModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview PDF
            </button>
          </div>

          <div id="report-print-content">
            <OrderTable orders={filteredOrders} totalSales={totalSales} isLoading={isFiltering} />
          </div>
        </div>

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
    </>
  );
};

export default OrdersReport;