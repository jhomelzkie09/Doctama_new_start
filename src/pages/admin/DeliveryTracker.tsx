// components/DeliveryTracker.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, Truck, Package, Clock, MapPin } from 'lucide-react';

interface DeliveryStats {
  pending: { processing: number; shipped: number; total: number };
  delivered: { today: number; thisWeek: number; thisMonth: number };
  revenue: { deliveredToday: number; deliveredThisWeek: number; deliveredThisMonth: number };
}

const DeliveryTracker = () => {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryStats();
  }, []);

  const fetchDeliveryStats = async () => {
    try {
      const response = await fetch('/api/orders/delivery/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch delivery stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {/* Pending Deliveries */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-amber-500" />
          <h3 className="font-medium text-stone-800">Pending Deliveries</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-500">Processing</span>
            <span className="font-medium text-amber-600">{stats.pending.processing}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">In Transit</span>
            <span className="font-medium text-blue-600">{stats.pending.shipped}</span>
          </div>
          <div className="pt-2 border-t flex justify-between">
            <span className="font-medium text-stone-700">Total Pending</span>
            <span className="font-bold text-stone-900">{stats.pending.total}</span>
          </div>
        </div>
      </div>

      {/* Delivered Today */}
      <div className="bg-white rounded-xl border border-emerald-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="font-medium text-stone-800">Delivered</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-500">Today</span>
            <span className="font-medium text-emerald-600">{stats.delivered.today}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">This Week</span>
            <span className="font-medium text-emerald-600">{stats.delivered.thisWeek}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">This Month</span>
            <span className="font-medium text-emerald-600">{stats.delivered.thisMonth}</span>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-stone-500" />
          <h3 className="font-medium text-stone-800">Revenue (Delivered)</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-500">Today</span>
            <span className="font-medium text-stone-700">₱{stats.revenue.deliveredToday.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">This Week</span>
            <span className="font-medium text-stone-700">₱{stats.revenue.deliveredThisWeek.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t flex justify-between">
            <span className="font-medium text-stone-700">This Month</span>
            <span className="font-bold text-emerald-600">₱{stats.revenue.deliveredThisMonth.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracker;