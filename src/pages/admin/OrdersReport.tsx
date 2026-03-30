import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Printer, Download, FileText, FileSpreadsheet, FileJson, Calendar } from 'lucide-react';
import ReportFilters from '../../components/admin/ReportFilters';
import reportService from '../../services/report.service';
import { useOrders } from '../../contexts/OrderContext';
import logo from '../../assets/logo.png';

const OrdersReport: React.FC = () => {
  const { state, getAllOrders } = useOrders();
  const { orders, loading } = state;
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    await getAllOrders();
  };

  useEffect(() => {
    filterOrders();
  }, [orders, dateRange]);

  // Helper function to safely format date
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

  // Helper function to get display date
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
    reportService.printReport('orders-report-content');
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

      {/* Status Stats */}
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

      {/* Report Content for Printing - UPDATED with Logo, Company Name and Address */}
      <div id="orders-report-content" className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Company Header for Print */}
        <div className="p-6 border-b bg-gray-50 print:bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-lg flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Doctama's Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Company Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctama's Marketing</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gabao, Bacon, Sorsogon City, Sorsogon, Philippines
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tel: +63 998 586 8888 | Email: support@doctama.com
                </p>
              </div>
            </div>
            {/* Report Title and Date */}
            <div className="text-right">
              <div className="bg-rose-50 px-4 py-2 rounded-lg">
                <p className="text-xs text-rose-600 font-medium">ORDERS REPORT</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="p-6 border-b bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Report Period</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Generated On</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {new Date().toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Generated By</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Report Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Orders Report Details</h2>
          <p className="text-gray-600 mt-1">
            Period: {dateRange.start} - {dateRange.end}
          </p>
          <div className="mt-2 flex gap-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Total Orders:</span> {filteredOrders.length}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Pending:</span> {statusStats.pending}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Processing:</span> {statusStats.processing}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Completed:</span> {statusStats.completed}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Cancelled:</span> {statusStats.cancelled}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders found in this date range</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      #{order.id?.toString().slice(-6) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getDisplayDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.user?.fullName || order.user?.name || order.customerName || 'Guest'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₱{(order.total || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.paymentMethod || order.payment_method || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.items?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Footer Summary Row */}
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    TOTAL:
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    ₱{filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={3} className="px-6 py-3 text-sm text-gray-600">
                    {filteredOrders.length} Orders
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer for Printing */}
        <div className="p-6 border-t bg-gray-50 print:bg-white">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <p>Doctama's Marketing - Gabao, Bacon, Sorsogon City, Sorsogon, Philippines</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="mt-2 text-center text-xs text-gray-400">
            <p>This is a computer-generated document. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersReport;