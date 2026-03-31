import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import ReportFilters from '../../components/admin/ReportFilters';
import reportService from '../../services/report.service';
import { useOrders } from '../../contexts/OrderContext';
import PDFReportModal from '../../components/admin/PDFReportModal';

const OrdersReport: React.FC = () => {
  const { state, getAllOrders } = useOrders();
  const { orders, loading } = state;
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    await getAllOrders();
  };

  useEffect(() => {
    filterOrders();
  }, [orders, dateRange]);

  const formatDate = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toISOString().split('T')[0];
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getDisplayDate = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filterOrders = () => {
    const filtered = orders.filter(order => {
      if (!order.createdAt) return false;
      try {
        const orderDate = formatDate(order.createdAt);
        return orderDate >= dateRange.start && orderDate <= dateRange.end;
      } catch (error) {
        return false;
      }
    });
    setFilteredOrders(filtered);
  };

  const getStatusStats = () => {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };
    
    filteredOrders.forEach(order => {
      const status = order.status?.toLowerCase() || '';
      switch (status) {
        case 'pending':
          stats.pending++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'completed':
        case 'delivered':
          stats.completed++;
          break;
        case 'cancelled':
        case 'canceled':
          stats.cancelled++;
          break;
      }
    });
    
    return stats;
  };

  const statusStats = getStatusStats();

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    const reportData = filteredOrders.map(order => ({
      'Order ID': order.id || 'N/A',
      'Date': getDisplayDate(order.createdAt),
      'Customer': order.user?.fullName || order.user?.name || order.customerName || 'Guest',
      'Total': `₱${(order.total || 0).toLocaleString()}`,
      'Status': order.status || 'N/A',
      'Payment Method': order.paymentMethod || order.payment_method || 'N/A',
      'Items': order.items?.length || 0
    }));

    const dateStr = `${dateRange.start}_to_${dateRange.end}`;
    
    switch (format) {
      case 'excel':
        reportService.exportToExcel(reportData, `orders_report_${dateStr}`);
        break;
      case 'csv':
        reportService.exportToCSV(reportData, `orders_report_${dateStr}`);
        break;
      case 'json':
        reportService.exportToJSON(reportData, `orders_report_${dateStr}`);
        break;
    }
    setExportLoading(false);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-print-content');
    if (printContent) {
      const originalTitle = document.title;
      document.title = 'Orders Report';
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Orders Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }
      document.title = originalTitle;
    }
  };

  const handlePreviewPDF = () => {
    setShowPDFModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  const ReportContent = () => (
    <>
      {/* Status Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{statusStats.pending}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Processing</p>
          <p className="text-lg font-bold text-blue-600">{statusStats.processing}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-lg font-bold text-green-600">{statusStats.completed}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Cancelled</p>
          <p className="text-lg font-bold text-red-600">{statusStats.cancelled}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found in this date range</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Order ID</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Total</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Payment</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">#{order.id?.toString().slice(-6) || 'N/A'}</td>
                  <td className="px-4 py-2 text-gray-600">{getDisplayDate(order.createdAt)}</td>
                  <td className="px-4 py-2 text-gray-900">{order.user?.fullName || order.user?.name || 'Guest'}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">₱{(order.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{order.paymentMethod || order.payment_method || 'N/A'}</td>
                  <td className="px-4 py-2 text-gray-600">{order.items?.length || 0}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-semibold">TOTAL:</td>
                <td className="px-4 py-2 font-bold text-gray-900">₱{totalSales.toLocaleString()}</td>
                <td colSpan={3} className="px-4 py-2 text-gray-600">{filteredOrders.length} Orders</td>
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
        <p className="text-sm font-semibold text-gray-800">Orders Summary</p>
        <p className="text-xs text-gray-600">Total Orders: {filteredOrders.length}</p>
        <p className="text-xs text-gray-600">Total Sales: ₱{totalSales.toLocaleString()}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-800">Order Breakdown</p>
        <p className="text-xs text-gray-600">Pending: {statusStats.pending} | Processing: {statusStats.processing}</p>
        <p className="text-xs text-gray-600">Completed: {statusStats.completed} | Cancelled: {statusStats.cancelled}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders Report</h1>
        <p className="text-gray-600 mt-1">View and export order details</p>
      </div>

      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        onPrint={handlePrint}
        loading={exportLoading}
      />

      <div className="flex justify-end mb-4">
        <button
          onClick={handlePreviewPDF}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
        >
          <Eye className="w-4 h-4" />
          Preview Report
        </button>
      </div>

      {/* Status Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">{statusStats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{statusStats.processing}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statusStats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{statusStats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* PDF Report Modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        title="Orders Report"
        onPrint={handlePrint}
        onExport={() => handleExport('excel')}
        period={`${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`}
        summary={summaryContent}
      >
        <ReportContent />
      </PDFReportModal>
    </div>
  );
};

export default OrdersReport;