import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react';
import ReportFilters from '../../components/admin/ReportFilters';
import reportService from '../../services/report.service';
import { useOrders } from '../../contexts/OrderContext';

const SalesReport: React.FC = () => {
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

  // Helper function to safely format date for comparison
  const formatDateForComparison = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
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
      const orderDate = formatDateForComparison(order.createdAt);
      if (!orderDate) return false;
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const uniqueCustomers = new Set(filteredOrders.map(order => order.userId || order.user?.id)).size;

    return { totalSales, totalOrders, averageOrderValue, uniqueCustomers };
  };

  const stats = calculateStats();

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
        reportService.exportToExcel(reportData, `sales_report_${dateStr}`);
        break;
      case 'csv':
        reportService.exportToCSV(reportData, `sales_report_${dateStr}`);
        break;
      case 'json':
        reportService.exportToJSON(reportData, `sales_report_${dateStr}`);
        break;
    }
    setExportLoading(false);
  };

  const handlePrint = () => {
    reportService.printReport('sales-report-content');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
        <p className="text-gray-600 mt-1">View and export sales data</p>
      </div>

      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        onPrint={handlePrint}
        loading={exportLoading}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₱{stats.totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₱{stats.averageOrderValue.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueCustomers}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content for Printing */}
      <div id="sales-report-content" className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Sales Report Details</h2>
          <p className="text-gray-600 mt-1">
            Period: {dateRange.start} - {dateRange.end}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Total Orders: {filteredOrders.length} | Total Sales: ₱{stats.totalSales.toLocaleString()}
          </p>
        </div>

        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sales found in this date range</p>
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
                      {order.items?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;