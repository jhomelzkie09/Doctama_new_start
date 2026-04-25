import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Download, Printer, Calendar, Filter, ChevronRight, Loader, ChevronLeft, CreditCard, Wallet, Banknote } from 'lucide-react';
import reportService from '../../services/report.service';
import { useOrders } from '../../contexts/OrderContext';
import PDFReportModal from '../../components/admin/PDFReportModal';
import logo from '../../assets/logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface DateRange {
  start: string;
  end: string;
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

const peso = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getPaymentMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case 'card': case 'credit_card': case 'debit_card': return CreditCard;
    case 'gcash': case 'wallet': case 'ewallet': return Wallet;
    case 'cod': case 'cash': return Banknote;
    default: return CreditCard;
  }
};

const formatPaymentMethod = (method: string) => {
  switch (method?.toLowerCase()) {
    case 'cod': return 'Cash on Delivery';
    case 'gcash': return 'GCash';
    case 'paymaya': return 'Maya';
    case 'card': case 'credit_card': return 'Credit Card';
    case 'debit_card': return 'Debit Card';
    default: return method || 'N/A';
  }
};

// ─── Company Header Component for PDF/Print ───────────────────────────────────

const CompanyHeader: React.FC = () => (
  <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-slate-200">
    <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-white shadow-sm">
      <img
        src={logo}
        alt="Doctama's Marketing Logo"
        className="w-14 h-14 object-contain"
      />
    </div>
    <div>
      <h1 className="text-xl font-bold text-slate-900 leading-tight">
        Doctama's Marketing
      </h1>
      <p className="text-sm text-slate-600 mt-0.5">
        Gabao, Bacon, Sorsogon City, Sorsogon, Philippines
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
        <span>📞 +63 998 586 8888</span>
        <span>✉️ support@doctama.com</span>
        <span>🌐 www.doctamasmarketing.com</span>
      </div>
    </div>
  </div>
);

// ─── Sales Transactions Table with Pagination ─────────────────────────────────

interface SalesTransactionsTableProps {
  orders: any[];
  isLoading?: boolean;
  showPagination?: boolean;
}

const SalesTransactionsTable: React.FC<SalesTransactionsTableProps> = ({ orders, isLoading, showPagination = true }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">Loading transaction data...</p>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Calendar className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">No transactions found for this period</p>
      </div>
    );
  }

  const totalPages = showPagination ? Math.ceil(orders.length / itemsPerPage) : 1;
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const displayOrders = showPagination ? paginatedOrders : orders;
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50 border-y border-slate-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-slate-100">
              {displayOrders.map((order) => {
                const PaymentIcon = getPaymentMethodIcon(order.paymentMethod || '');
                const paymentStatus = String(order.paymentStatus ?? '').toLowerCase();
                const orderStatus = String(order.status ?? '').toLowerCase();
                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                    {toDisplayDate(order.orderDate ?? order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded">
                      #{order.orderNumber?.slice(-8) ?? String(order.id).slice(-8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-medium">{order.customerName ?? 'Guest'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-full bg-slate-100 text-xs font-bold px-2">
                      {order.items?.length ?? 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <PaymentIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 font-medium text-xs">{formatPaymentMethod(order.paymentMethod || '')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold border ${
                      paymentStatus === 'paid' || paymentStatus === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : paymentStatus === 'failed' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        paymentStatus === 'paid' || paymentStatus === 'completed' 
                          ? 'bg-emerald-500' 
                          : paymentStatus === 'failed' 
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                      }`}></span>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold border ${
                      orderStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      orderStatus === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      orderStatus === 'processing' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      orderStatus === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        orderStatus === 'delivered' ? 'bg-emerald-500' :
                        orderStatus === 'shipped' ? 'bg-blue-500' :
                        orderStatus === 'processing' ? 'bg-purple-500' :
                        orderStatus === 'cancelled' ? 'bg-rose-500' :
                        'bg-amber-500'
                      }`}></span>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{peso(order.totalAmount ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 no-print">
          <p className="text-xs font-medium text-slate-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-slate-400">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalesReport: React.FC = () => {
  const { state, getAllOrders } = useOrders();
  const { orders, loading: ordersLoading, error: ordersError } = state;

  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getAllOrders();
  }, []);

  useEffect(() => {
    const applyFilter = async () => {
      setIsFiltering(true);
      await new Promise(resolve => setTimeout(resolve, 300));
       
      const filtered = orders.filter((order) => {
        const orderDate = toLocalDateStr(order.orderDate ?? order.createdAt);
        if (!orderDate) return false;
        const isWithinDateRange = orderDate >= dateRange.start && orderDate <= dateRange.end;
        if (!isWithinDateRange) return false;

        const orderStatus = String(order.status ?? '').toLowerCase();
        const paymentStatus = String(order.paymentStatus ?? '').toLowerCase();
        const paymentMethod = String(order.paymentMethod ?? '').toLowerCase();
        const isDelivered = orderStatus === 'delivered';
        const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed' || paymentMethod === 'cod';

        return isDelivered && isPaid;
      });
      setFilteredOrders(filtered);
      setIsFiltering(false);
    };
     
    applyFilter();
  }, [orders, dateRange]);

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handlePeriodTypeChange = (value: PeriodType) => {
    setPeriodType(value);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsGenerating(false);
    setShowPDFModal(true);
  };

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    
    if (format === 'excel') {
      const transactionRows = filteredOrders.map(order => ({
        Date: toDisplayDate(order.orderDate ?? order.createdAt),
        'Order #': order.orderNumber ?? order.id,
        Customer: order.customerName ?? 'Guest',
        Items: order.items?.length ?? 0,
        'Payment Method': formatPaymentMethod(order.paymentMethod ?? ''),
        'Payment Status': order.paymentStatus ?? 'Pending',
        'Order Status': order.status ?? 'Pending',
        Total: order.totalAmount ?? 0,
      }));
      
      reportService.exportToExcel(transactionRows, `sales_transactions_${dateRange.start}_to_${dateRange.end}`);
    } else if (format === 'csv') {
      const rows = filteredOrders.map(order => ({
        Date: toDisplayDate(order.orderDate ?? order.createdAt),
        'Order #': order.orderNumber ?? order.id,
        Customer: order.customerName ?? 'Guest',
        'Payment Method': formatPaymentMethod(order.paymentMethod ?? ''),
        'Payment Status': order.paymentStatus ?? 'Pending',
        'Order Status': order.status ?? 'Pending',
        Total: peso(order.totalAmount ?? 0),
      }));
      reportService.exportToCSV(rows, `sales_report_${dateRange.start}_to_${dateRange.end}`);
    } else {
      reportService.exportToJSON(filteredOrders, `sales_report_${dateRange.start}_to_${dateRange.end}`);
    }
    
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
          <title>Sales Transactions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #334155; }
            .company-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
            .company-header img { width: 64px; height: 64px; object-fit: contain; }
            .company-header h1 { margin: 0; font-size: 24px; color: #0f172a; }
            .company-header p { margin: 4px 0; color: #475569; }
            .summary { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; }
            .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .no-print { display: none; }
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
            <p><strong>Total Transactions:</strong> ${filteredOrders.length}</p>
            <p><strong>Total Sales:</strong> ${peso(filteredOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0))}</p>
          </div>
          ${content.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Doctama Furniture - Sales Report</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
  };

  const totalSales = filteredOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const totalOrders = filteredOrders.length;

  const summaryContent = (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <p className="text-sm font-bold text-slate-800">Sales Summary</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {periodType === 'daily' ? 'Daily' : periodType === 'weekly' ? 'Weekly' : 'Monthly'} Report
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500 mb-1">Total Sales</p>
          <p className="text-xl font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">{peso(totalSales)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 mb-1">Average per Order</p>
          <p className="text-2xl font-bold text-slate-800">{peso(totalOrders > 0 ? totalSales / totalOrders : 0)}</p>
        </div>
      </div>
    </div>
  );

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-t-2 border-violet-400 animate-spin opacity-50"></div>
          </div>
          <p className="text-sm font-semibold text-slate-500">Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isFiltering && <LoadingOverlay message="Filtering sales data..." />}
      {exportLoading && <LoadingOverlay message="Generating export file..." />}
      {isGenerating && <LoadingOverlay message="Generating report..." />}
      
      <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
        {ordersError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-sm font-medium">
            {ordersError}
          </div>
        )}
        {/* Simple Header - No company logo here */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Sales Report</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Generate and export sales transaction reports.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex flex-wrap gap-5 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="w-48">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Filter className="w-3.5 h-3.5" /> View By
              </label>
              <div className="relative">
                <select
                  value={periodType}
                  onChange={(e) => handlePeriodTypeChange(e.target.value as PeriodType)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || filteredOrders.length === 0}
                className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Generate Report
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={exportLoading || filteredOrders.length === 0}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </button>
              <button
                onClick={handlePrint}
                disabled={filteredOrders.length === 0}
                className="px-5 py-2.5 bg-slate-800 text-white font-semibold rounded-xl text-sm hover:bg-slate-900 shadow-sm hover:shadow-md active:transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Sales Transactions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                <Calendar className="w-4 h-4" />
              </div>
              Sales Transactions
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
                {filteredOrders.length} transactions
              </span>
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-600 rounded-full">
                Total: {peso(totalSales)}
              </span>
            </div>
          </div>

          <div id="report-print-content">
            <SalesTransactionsTable orders={filteredOrders} isLoading={isFiltering} />
          </div>
        </div>

        {/* PDF Modal - Includes Company Header */}
        <PDFReportModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          title="Sales Transactions Report"
          onPrint={handlePrint}
          onExport={() => handleExport('excel')}
          period={`${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}`}
          summary={summaryContent}
        >
          <>
            <CompanyHeader />
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <SalesTransactionsTable orders={filteredOrders} showPagination={false} />
            </div>
          </>
        </PDFReportModal>
      </div>
    </>
  );
};

export default SalesReport;
