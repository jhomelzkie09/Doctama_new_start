import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Eye, Download, Printer, Calendar, BarChart3, Package, Crown, ArrowUp, ArrowDown, Filter, RefreshCw, ChevronRight, Loader } from 'lucide-react';
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

const formatShortDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const peso = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  colorTheme: 'emerald' | 'indigo' | 'violet' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, trendLabel, colorTheme }) => {
  const themeStyles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-slate-100 group flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${themeStyles[colorTheme]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend >= 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {trendLabel && <p className="text-xs text-slate-400 mt-2 font-medium">{trendLabel}</p>}
      </div>
    </div>
  );
};

interface RevenueChartProps {
  data: PeriodSales[];
  periodType: PeriodType;
  isLoading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, periodType, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">Loading chart data...</p>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">No sales data available for this period</p>
      </div>
    );
  }
  
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800">
          {periodType === 'daily' ? 'Daily Sales Trend' : periodType === 'weekly' ? 'Weekly Sales Trend' : 'Monthly Sales Trend'}
        </h3>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
            <span className="text-slate-500">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-300 rounded-sm"></div>
            <span className="text-slate-500">Orders</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 font-medium">{formatPeriodLabel(item.period, periodType)}</span>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-900">{peso(item.revenue)}</span>
                <span className="text-slate-400 text-xs w-16 text-right">{item.orders} orders</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-400">
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
  isLoading?: boolean;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ products, totalRevenue, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">Loading product data...</p>
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Package className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">No product sales data available</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
            <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
            <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Units Sold</th>
            <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
            <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">% of Total</th>
           </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product, idx) => (
            <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
              <td className="px-4 py-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 group-hover:bg-white transition-colors border border-slate-100">
                  {idx === 0 ? (
                    <Crown className="w-4 h-4 text-amber-500" />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-800">{product.name}</td>
              <td className="px-4 py-4 text-right text-slate-600 font-medium">{product.sold}</td>
              <td className="px-4 py-4 text-right font-bold text-slate-900">{peso(product.revenue)}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full"
                      style={{ width: `${product.percentageOfTotal}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-8">{product.percentageOfTotal.toFixed(1)}%</span>
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
  isLoading?: boolean;
}

const SalesTransactionsTable: React.FC<SalesTransactionsTableProps> = ({ orders, isLoading }) => {
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
        <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">No transactions found</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50/50 border-y border-slate-200">
            {['Date', 'Order #', 'Customer', 'Items', 'Payment', 'Status', 'Total'].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{toDisplayDate(order.orderDate ?? order.createdAt)}</td>
              <td className="px-6 py-4 font-mono text-xs font-medium text-indigo-600 bg-indigo-50/30 rounded inline-block mt-3 ml-2 px-2">#{order.orderNumber?.slice(-8) ?? order.id}</td>
              <td className="px-6 py-4 text-slate-800 font-medium">{order.customerName ?? 'Guest'}</td>
              <td className="px-6 py-4 text-slate-600">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold">{order.items?.length ?? 0}</span>
              </td>
              <td className="px-6 py-4 text-slate-600 capitalize font-medium">{order.paymentMethod ?? 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold border ${
                  order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-emerald-500' :
                    order.status === 'cancelled' ? 'bg-rose-500' :
                    'bg-amber-500'
                  }`}></span>
                  {order.status ?? 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 font-bold text-slate-900">{peso(order.totalAmount ?? 0)}</td>
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
  const { orders, loading: ordersLoading } = state;

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
  const [isFiltering, setIsFiltering] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);

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

  // Filter orders when date range changes
  useEffect(() => {
    const applyFilter = async () => {
      setIsFiltering(true);
      // Simulate a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filtered = orders.filter((order) => {
        const orderDate = toLocalDateStr(order.orderDate ?? order.createdAt);
        if (!orderDate) return false;
        
        const isAfterStart = orderDate >= dateRange.start;
        const isBeforeEnd = orderDate <= dateRange.end;
        
        return isAfterStart && isBeforeEnd;
      });
      setFilteredOrders(filtered);
      setIsFiltering(false);
    };
    
    applyFilter();
  }, [orders, dateRange]);

  // Show processing indicator when calculating stats
  useEffect(() => {
    if (filteredOrders.length > 0) {
      setIsProcessingData(true);
      const timer = setTimeout(() => setIsProcessingData(false), 500);
      return () => clearTimeout(timer);
    }
  }, [filteredOrders, periodType]);

  // Calculate current period stats
  const currentStats = useMemo((): SalesStats => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
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
    const calculatePreviousStats = () => {
      if (!previousDateRange.start || !previousDateRange.end) return;
      
      const prevOrders = orders.filter((order) => {
        const d = toLocalDateStr(order.orderDate ?? order.createdAt);
        return d && d >= previousDateRange.start && d <= previousDateRange.end;
      });
      
      const prevRevenue = prevOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
      const prevOrdersCount = prevOrders.length;
      
      const revenueGrowth = prevRevenue > 0 
        ? ((currentStats.totalRevenue - prevRevenue) / prevRevenue) * 100 
        : currentStats.totalRevenue > 0 ? 100 : 0;
      
      const ordersGrowth = prevOrdersCount > 0 
        ? ((currentStats.totalOrders - prevOrdersCount) / prevOrdersCount) * 100 
        : currentStats.totalOrders > 0 ? 100 : 0;
      
      currentStats.previousPeriodRevenue = prevRevenue;
      currentStats.revenueGrowth = revenueGrowth;
      currentStats.previousPeriodOrders = prevOrdersCount;
      currentStats.ordersGrowth = ordersGrowth;
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
      const amount = order.totalAmount ?? 0;
      
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
    
    const totalRevenue = currentStats.totalRevenue;
    return Array.from(productSales.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        sold: data.sold,
        revenue: data.revenue,
        percentageOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders, currentStats.totalRevenue]);

  const uniqueCustomers = useMemo(() => {
    return Array.from(new Set(filteredOrders.map(o => o.customerEmail ?? o.userId))).length;
  }, [filteredOrders]);

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handlePeriodTypeChange = (value: PeriodType) => {
    setPeriodType(value);
  };

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    
    if (format === 'excel') {
      const summaryRows = [
        { Metric: 'Total Revenue', Value: peso(currentStats.totalRevenue) },
        { Metric: 'Total Orders', Value: currentStats.totalOrders },
        { Metric: 'Average Order Value', Value: peso(currentStats.averageOrderValue) },
        { Metric: 'Revenue Growth', Value: `${currentStats.revenueGrowth.toFixed(1)}%` },
        { Metric: 'Orders Growth', Value: `${currentStats.ordersGrowth.toFixed(1)}%` },
        { Metric: 'Period', Value: `${toDisplayDate(dateRange.start)} - ${toDisplayDate(dateRange.end)}` },
      ];
      
      reportService.exportToExcel(summaryRows, `sales_summary_${dateRange.start}_to_${dateRange.end}`);
      
      const productRows = topProducts.map(p => ({
        'Product Name': p.name,
        'Units Sold': p.sold,
        Revenue: peso(p.revenue),
        '% of Total': `${p.percentageOfTotal.toFixed(1)}%`,
      }));
      
      reportService.exportToExcel(productRows, `top_products_${dateRange.start}_to_${dateRange.end}`);
      
      const transactionRows = filteredOrders.map(order => ({
        Date: toDisplayDate(order.orderDate ?? order.createdAt),
        'Order #': order.orderNumber ?? order.id,
        Customer: order.customerName ?? 'Guest',
        Items: order.items?.length ?? 0,
        'Payment Method': order.paymentMethod ?? 'N/A',
        Status: order.status ?? 'N/A',
        Total: peso(order.totalAmount ?? 0),
      }));
      
      reportService.exportToExcel(transactionRows, `sales_transactions_${dateRange.start}_to_${dateRange.end}`);
    } else if (format === 'csv') {
      const rows = filteredOrders.map(order => ({
        Date: toDisplayDate(order.orderDate ?? order.createdAt),
        'Order #': order.orderNumber ?? order.id,
        Customer: order.customerName ?? 'Guest',
        Total: peso(order.totalAmount ?? 0),
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
            body { font-family: Arial, sans-serif; margin: 20px; color: #334155; }
            h1 { color: #0f172a; }
            .summary { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { padding: 15px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; }
            .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
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
            <div class="stat-card"><strong style="color: #64748b; font-size: 13px;">Total Revenue</strong><br><span style="font-size: 20px; font-weight: bold; color: #0f172a;">${peso(currentStats.totalRevenue)}</span></div>
            <div class="stat-card"><strong style="color: #64748b; font-size: 13px;">Total Orders</strong><br><span style="font-size: 20px; font-weight: bold; color: #0f172a;">${currentStats.totalOrders}</span></div>
            <div class="stat-card"><strong style="color: #64748b; font-size: 13px;">Avg Order Value</strong><br><span style="font-size: 20px; font-weight: bold; color: #0f172a;">${peso(currentStats.averageOrderValue)}</span></div>
            <div class="stat-card"><strong style="color: #64748b; font-size: 13px;">Revenue Growth</strong><br><span style="font-size: 20px; font-weight: bold; color: #0f172a;">${currentStats.revenueGrowth.toFixed(1)}%</span></div>
          </div>
          <h2>Top Selling Products</h2>
          <table>
            <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>% of Total</th></tr></thead>
            <tbody>
              ${topProducts.map(p => `<tr><td><strong>${p.name}</strong></td><td>${p.sold}</td><td>${peso(p.revenue)}</td><td>${p.percentageOfTotal.toFixed(1)}%</td></tr>`).join('')}
            </tbody>
          </table>
          <h2 style="margin-top: 40px;">Sales Transactions</h2>
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
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <p className="text-sm font-bold text-slate-800">Sales Performance</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {periodType === 'daily' ? 'Daily' : periodType === 'weekly' ? 'Weekly' : 'Monthly'} Analysis
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">{peso(currentStats.totalRevenue)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="bg-slate-50 p-3 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 mb-1">Orders</p>
          <p className="text-base font-bold text-slate-800">{currentStats.totalOrders}</p>
          <p className={`text-xs mt-1 font-bold ${currentStats.ordersGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {currentStats.ordersGrowth >= 0 ? '↑' : '↓'} {Math.abs(currentStats.ordersGrowth).toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 mb-1">Avg Order</p>
          <p className="text-base font-bold text-slate-800">{peso(currentStats.averageOrderValue)}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 mb-1">Top Product</p>
          <p className="text-sm font-bold text-slate-800 truncate" title={topProducts[0]?.name || 'N/A'}>
            {topProducts[0]?.name || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );

  // Main loading state
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
      {/* Loading Overlays */}
      {isFiltering && <LoadingOverlay message="Filtering sales data..." />}
      {exportLoading && <LoadingOverlay message="Generating export file..." />}
      {isProcessingData && <LoadingOverlay message="Processing sales metrics..." />}
      
      <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Sales Performance</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Track revenue trends, analyze performance, and identify top-selling products.</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowPDFModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Preview Report
            </button>
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
                  <option value="daily">Daily Analysis</option>
                  <option value="weekly">Weekly Analysis</option>
                  <option value="monthly">Monthly Analysis</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('excel')}
                disabled={exportLoading}
                className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {exportLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Data
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-slate-800 text-white font-semibold rounded-xl text-sm hover:bg-slate-900 shadow-sm hover:shadow-md active:transform active:scale-95 transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Revenue"
            value={peso(currentStats.totalRevenue)}
            icon={<DollarSign className="w-6 h-6" />}
            trend={currentStats.revenueGrowth}
            trendLabel="vs previous period"
            colorTheme="emerald"
          />
          <StatCard
            label="Total Orders"
            value={String(currentStats.totalOrders)}
            icon={<ShoppingBag className="w-6 h-6" />}
            trend={currentStats.ordersGrowth}
            trendLabel="vs previous period"
            colorTheme="indigo"
          />
          <StatCard
            label="Average Order Value"
            value={peso(currentStats.averageOrderValue)}
            icon={<TrendingUp className="w-6 h-6" />}
            colorTheme="violet"
          />
          <StatCard
            label="Unique Customers"
            value={String(uniqueCustomers)}
            icon={<Users className="w-6 h-6" />}
            colorTheme="amber"
          />
        </div>

        {/* Revenue Chart & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <RevenueChart data={periodSales} periodType={periodType} isLoading={isFiltering || isProcessingData} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                  <Crown className="w-4 h-4" />
                </div>
                Top Selling Products
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
                {topProducts.length} items
              </span>
            </div>
            <div className="p-2 flex-1 overflow-auto">
              <TopProductsTable products={topProducts} totalRevenue={currentStats.totalRevenue} isLoading={isFiltering || isProcessingData} />
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
              Recent Transactions
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
              {filteredOrders.length} orders
            </span>
          </div>

          <div id="report-print-content">
            <SalesTransactionsTable orders={filteredOrders} isLoading={isFiltering} />
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
            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Top Selling Products</h3>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <TopProductsTable products={topProducts} totalRevenue={currentStats.totalRevenue} />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Sales Transactions</h3>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <SalesTransactionsTable orders={filteredOrders} />
              </div>
            </div>
          </>
        </PDFReportModal>
      </div>
    </>
  );
};

export default SalesReport;