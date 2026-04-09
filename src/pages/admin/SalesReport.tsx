import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Eye, Download, Printer, Calendar, BarChart3, Package, Crown, ArrowUp, ArrowDown, Filter, RefreshCw } from 'lucide-react';
import reportService from '../../services/report.service';
import { useOrders } from '../../contexts/OrderContext';
import PDFReportModal from '../../components/admin/PDFReportModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface DateRange {
  start: string;
  end: string;
}

interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  previousPeriodRevenue: number;
  revenueGrowth: number;
  previousPeriodOrders: number;
  ordersGrowth: number;
}

interface PeriodSales {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

interface TopProduct {
  id: number;
  name: string;
  sold: number;
  revenue: number;
  percentageOfTotal: number;
}

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
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

const formatShortDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const peso = (n: number) => `₱${n.toLocaleString()}`;

const getPeriodKey = (date: Date, periodType: PeriodType): string => {
  if (periodType === 'daily') {
    return date.toISOString().split('T')[0];
  } else if (periodType === 'weekly') {
    const weekStart = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    return `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() - weekStart.getDay() + 10) / 7)}`;
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
};

const formatPeriodLabel = (periodKey: string, periodType: PeriodType): string => {
  if (periodType === 'daily') {
    return toDisplayDate(periodKey);
  } else if (periodType === 'weekly') {
    const [year, week] = periodKey.split('-W');
    return `Week ${week}, ${year}`;
  } else {
    const [year, month] = periodKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, trendLabel }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-rose-50 rounded-lg">{icon}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {trendLabel && <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>}
  </div>
);

interface RevenueChartProps {
  data: PeriodSales[];
  periodType: PeriodType;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, periodType }) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No sales data available</p>
      </div>
    );
  }
  
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">
          {periodType === 'daily' ? 'Daily Sales Trend' : periodType === 'weekly' ? 'Weekly Sales Trend' : 'Monthly Sales Trend'}
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
            <span className="text-gray-500">Revenue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-gray-500">Orders</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">{formatPeriodLabel(item.period, periodType)}</span>
              <div className="flex gap-3">
                <span className="font-medium text-rose-600">{peso(item.revenue)}</span>
                <span className="text-gray-400">{item.orders} orders</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400">
                  Avg: {peso(item.averageOrderValue)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TopProductsTableProps {
  products: TopProduct[];
  totalRevenue: number;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ products, totalRevenue }) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No product sales data available</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product, idx) => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                {idx === 0 ? (
                  <Crown className="w-4 h-4 text-yellow-500" />
                ) : (
                  <span className="text-xs font-medium text-gray-400">#{idx + 1}</span>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
              <td className="px-4 py-3 text-right text-gray-600">{product.sold}</td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">{peso(product.revenue)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-rose-500 h-1.5 rounded-full"
                      style={{ width: `${product.percentageOfTotal}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{product.percentageOfTotal}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
       </table>
    </div>
  );
};

interface SalesTransactionsTableProps {
  orders: any[];
}

const SalesTransactionsTable: React.FC<SalesTransactionsTableProps> = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No transactions found</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Date', 'Order #', 'Customer', 'Items', 'Payment', 'Status', 'Total'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
           </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600">{toDisplayDate(order.orderDate ?? order.createdAt)}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.orderNumber?.slice(-8) ?? order.id}</td>
              <td className="px-4 py-3 text-gray-900">{order.customerName ?? 'Guest'}</td>
              <td className="px-4 py-3 text-gray-600">{order.items?.length ?? 0}</td>
              <td className="px-4 py-3 text-gray-600 capitalize">{order.paymentMethod ?? 'N/A'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status ?? 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{peso(order.totalAmount ?? order.total ?? 0)}</td>
            </tr>
          ))}
        </tbody>
       </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalesReport: React.FC = () => {
  const { state, getAllOrders } = useOrders();
  const { orders, loading } = state;

  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [previousDateRange, setPreviousDateRange] = useState<DateRange>({
    start: '',
    end: '',
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    getAllOrders();
  }, []);

  // Calculate previous period for comparison
  useEffect(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const duration = end.getTime() - start.getTime();
    
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setTime(prevStart.getTime() - duration);
    
    setPreviousDateRange({
      start: prevStart.toISOString().split('T')[0],
      end: prevEnd.toISOString().split('T')[0],
    });
  }, [dateRange]);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const d = toLocalDateStr(order.orderDate ?? order.createdAt);
      return d && d >= dateRange.start && d <= dateRange.end;
    });
    setFilteredOrders(filtered);
  }, [orders, dateRange]);

  // Calculate current period stats
  const currentStats = useMemo((): SalesStats => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalAmount ?? o.total ?? 0), 0);
    const totalOrders = filteredOrders.length;
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      previousPeriodRevenue: 0,
      revenueGrowth: 0,
      previousPeriodOrders: 0,
      ordersGrowth: 0,
    };
  }, [filteredOrders]);

  // Calculate previous period stats for comparison
  useEffect(() => {
    const calculatePreviousStats = async () => {
      if (!previousDateRange.start || !previousDateRange.end) return;
      
      const prevOrders = orders.filter((order) => {
        const d = toLocalDateStr(order.orderDate ?? order.createdAt);
        return d && d >= previousDateRange.start && d <= previousDateRange.end;
      });
      
      const prevRevenue = prevOrders.reduce((s, o) => s + (o.totalAmount ?? o.total ?? 0), 0);
      const prevOrdersCount = prevOrders.length;
      
      currentStats.previousPeriodRevenue = prevRevenue;
      currentStats.revenueGrowth = prevRevenue > 0 
        ? ((currentStats.totalRevenue - prevRevenue) / prevRevenue) * 100 
        : 100;
      currentStats.previousPeriodOrders = prevOrdersCount;
      currentStats.ordersGrowth = prevOrdersCount > 0 
        ? ((currentStats.totalOrders - prevOrdersCount) / prevOrdersCount) * 100 
        : 100;
    };
    
    calculatePreviousStats();
  }, [orders, previousDateRange, currentStats]);

  // Calculate period-based sales data
  const periodSales = useMemo((): PeriodSales[] => {
    const periodMap = new Map<string, { revenue: number; orders: number }>();
    
    filteredOrders.forEach(order => {
      const orderDate = order.orderDate ?? order.createdAt;
      if (!orderDate) return;
      
      const date = new Date(orderDate);
      const periodKey = getPeriodKey(date, periodType);
      const existing = periodMap.get(periodKey);
      const amount = order.totalAmount ?? order.total ?? 0;
      
      if (existing) {
        existing.revenue += amount;
        existing.orders += 1;
      } else {
        periodMap.set(periodKey, { revenue: amount, orders: 1 });
      }
    });
    
    const result = Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        orders: data.orders,
        averageOrderValue: data.revenue / data.orders,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
    
    return result;
  }, [filteredOrders, periodType]);

  // Calculate top selling products
  const topProducts = useMemo((): TopProduct[] => {
    const productSales = new Map<number, { name: string; sold: number; revenue: number }>();
    
    filteredOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        const existing = productSales.get(item.productId);
        const itemRevenue = (item.unitPrice ?? item.price) * item.quantity;
        
        if (existing) {
          existing.sold += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          productSales.set(item.productId, {
            name: item.productName,
            sold: item.quantity,
            revenue: itemRevenue,
          });
        }
      });
    });
    
    return Array.from(productSales.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        sold: data.sold,
        revenue: data.revenue,
        percentageOfTotal: currentStats.totalRevenue > 0 
          ? (data.revenue / currentStats.totalRevenue) * 100 
          : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders, currentStats.totalRevenue]);

  // Calculate daily sales for chart
  const dailySales = useMemo((): DailySales[] => {
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    
    filteredOrders.forEach(order => {
      const date = toLocalDateStr(order.orderDate ?? order.createdAt);
      if (!date) return;
      
      const existing = dailyMap.get(date);
      const amount = order.totalAmount ?? order.total ?? 0;
      
      if (existing) {
        existing.revenue += amount;
        existing.orders += 1;
      } else {
        dailyMap.set(date, { revenue: amount, orders: 1 });
      }
    });
    
    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, revenue: data.revenue, orders: data.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    
    if (format === 'excel') {
      // Export sales summary
      const summaryRows = [
        { Metric: 'Total Revenue', Value: peso(currentStats.totalRevenue) },
        { Metric: 'Total Orders', Value: currentStats.totalOrders },
        { Metric: 'Average Order Value', Value: peso(currentStats.averageOrderValue) },
        { Metric: 'Revenue Growth', Value: `${currentStats.revenueGrowth.toFixed(1)}%` },
        { Metric: 'Orders Growth', Value: `${currentStats.ordersGrowth.toFixed(1)}%` },
        { Metric: 'Period', Value: `${toDisplayDate(dateRange.start)} - ${toDisplayDate(dateRange.end)}` },
      ];
      
      // Export top products
      const productRows = topProducts.map(p => ({
        'Product Name': p.name,
        'Units Sold': p.sold,
        Revenue: peso(p.revenue),
        '% of Total': `${p.percentageOfTotal.toFixed(1)}%`,
      }));
      
      // Export transactions
      const transactionRows = filteredOrders.map(order => ({
        Date: toDisplayDate(order.orderDate ?? order.createdAt),
        'Order #': order.orderNumber ?? order.id,
        Customer: order.customerName ?? 'Guest',
        Items: order.items?.length ?? 0,
        'Payment Method': order.paymentMethod ?? 'N/A',
        Status: order.status ?? 'N/A',
        Total: peso(order.totalAmount ?? order.total ?? 0),
      }));
      
      reportService.exportToExcel(summaryRows, `sales_summary_${dateRange.start}_to_${dateRange.end}`);
      reportService.exportToExcel(productRows, `top_products_${dateRange.start}_to_${dateRange.end}`);
      reportService.exportToExcel(transactionRows, `sales_transactions_${dateRange.start}_to_${dateRange.end}`);
    } else if (format === 'csv') {
      const rows = filteredOrders.map(order => ({
        Date: toDisplayDate(order.orderDate ?? order.createdAt),
        'Order #': order.orderNumber ?? order.id,
        Customer: order.customerName ?? 'Guest',
        Total: peso(order.totalAmount ?? order.total ?? 0),
        Status: order.status ?? 'N/A',
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
          <title>Sales Performance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { padding: 15px; background: white; border: 1px solid #ddd; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Sales Performance Report</h1>
          <div class="summary">
            <p><strong>Period:</strong> ${toDisplayDate(dateRange.start)} – ${toDisplayDate(dateRange.end)}</p>
            <p><strong>Report Type:</strong> ${periodType.toUpperCase()} Sales Analysis</p>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><strong>Total Revenue</strong><br>${peso(currentStats.totalRevenue)}</div>
            <div class="stat-card"><strong>Total Orders</strong><br>${currentStats.totalOrders}</div>
            <div class="stat-card"><strong>Avg Order Value</strong><br>${peso(currentStats.averageOrderValue)}</div>
            <div class="stat-card"><strong>Revenue Growth</strong><br>${currentStats.revenueGrowth.toFixed(1)}%</div>
          </div>
          <h2>Top Selling Products</h2>
          <table>
            <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>% of Total</th></tr></thead>
            <tbody>
              ${topProducts.map(p => `<tr><td>${p.name}</td><td>${p.sold}</td><td>${peso(p.revenue)}</td><td>${p.percentageOfTotal.toFixed(1)}%</td></tr>`).join('')}
            </tbody>
          </table>
          ${content.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Doctama Furniture - Sales Performance Report</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.onafterprint = () => win.close();
  };

  const summaryContent = (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">Sales Performance</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {periodType === 'daily' ? 'Daily' : periodType === 'weekly' ? 'Weekly' : 'Monthly'} Analysis
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">Total Revenue</p>
          <p className="text-lg font-bold text-rose-600">{peso(currentStats.totalRevenue)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2 border-t">
        <div>
          <p className="text-xs text-gray-400">Orders</p>
          <p className="text-sm font-semibold">{currentStats.totalOrders}</p>
          <p className={`text-xs ${currentStats.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currentStats.ordersGrowth >= 0 ? '↑' : '↓'} {Math.abs(currentStats.ordersGrowth).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Avg Order</p>
          <p className="text-sm font-semibold">{peso(currentStats.averageOrderValue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Top Product</p>
          <p className="text-sm font-semibold truncate">{topProducts[0]?.name || 'N/A'}</p>
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
        <p className="text-sm text-gray-500 mt-1">Track revenue trends, analyze performance, and identify top-selling products</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">View By</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as PeriodType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex gap-2">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={peso(currentStats.totalRevenue)}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          trend={currentStats.revenueGrowth}
          trendLabel="vs previous period"
        />
        <StatCard
          label="Total Orders"
          value={String(currentStats.totalOrders)}
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
          trend={currentStats.ordersGrowth}
          trendLabel="vs previous period"
        />
        <StatCard
          label="Average Order Value"
          value={peso(currentStats.averageOrderValue)}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="Unique Customers"
          value={String(new Set(filteredOrders.map(o => o.customerEmail ?? o.userId)).size)}
          icon={<Users className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Revenue Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <RevenueChart data={periodSales} periodType={periodType} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            Top Selling Products
            <span className="text-xs text-gray-400 ml-2">({topProducts.length} products)</span>
          </h3>
          <TopProductsTable products={topProducts} totalRevenue={currentStats.totalRevenue} />
        </div>
      </div>

      {/* Sales Transactions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-600" />
            Sales Transactions
            <span className="text-xs text-gray-400 ml-2">({filteredOrders.length} transactions)</span>
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
          <SalesTransactionsTable orders={filteredOrders} />
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
        <>
          <RevenueChart data={periodSales} periodType={periodType} />
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Selling Products</h3>
            <TopProductsTable products={topProducts} totalRevenue={currentStats.totalRevenue} />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sales Transactions</h3>
            <SalesTransactionsTable orders={filteredOrders} />
          </div>
        </>
      </PDFReportModal>
    </div>
  );
};

export default SalesReport;