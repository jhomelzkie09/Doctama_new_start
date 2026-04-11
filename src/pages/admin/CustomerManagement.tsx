import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import orderService from '../../services/order.service';
import {
  Users, Search, Download, RefreshCw, Eye, Edit, Trash2,
  Phone, Calendar, DollarSign, Star, AlertCircle,
  ChevronLeft, ChevronRight, UserPlus, CheckCircle, XCircle,
  TrendingUp, Shield, ArrowUpDown, DownloadCloud, Clock,
  Activity, Crown, Heart, Sparkles, Award, Filter, ChevronDown,
  MoreHorizontal, Mail, X
} from 'lucide-react';
import { User, Order, OrderStatus } from '../../types';

interface CustomerWithStats extends User {
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    favoriteCategory?: string;
    reviewCount: number;
    returnCount: number;
    cancellationCount: number;
  };
  recentOrders: Order[];
  addressSummary?: string;
}

interface CustomerFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  verified: 'all' | 'verified' | 'unverified';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'name' | 'email' | 'orders' | 'spent' | 'joined';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface QuickStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersToday: number;
  totalRevenue: number;
  averageOrderValue: number;
  verifiedRate: number;
  conversionRate: number;
}

// Tier config
const getTier = (spent: number) => {
  if (spent >= 50000) return { name: 'Diamond', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: Crown };
  if (spent >= 25000) return { name: 'Platinum', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: Award };
  if (spent >= 10000) return { name: 'Gold', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Star };
  if (spent >= 5000) return { name: 'Silver', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: Heart };
  return { name: 'Bronze', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', icon: Sparkles };
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ customer }: { customer: CustomerWithStats }) => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6'];
  const idx = (customer.email?.charCodeAt(0) || 0) % colors.length;
  const initial = (customer.fullName || customer.email || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: `${colors[idx]}22`, border: `1.5px solid ${colors[idx]}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 600, color: colors[idx], fontFamily: "'DM Mono', monospace",
      position: 'relative'
    }}>
      {customer.profileImage
        ? <img src={customer.profileImage} alt={customer.fullName}
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        : initial}
      {customer.isActive && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 8, height: 8, background: '#22c55e',
          borderRadius: '50%', border: '2px solid var(--surface)'
        }} />
      )}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent, trend }: {
  label: string; value: string; sub?: string; accent: string; trend?: string;
}) => (
  <div style={{
    background: 'var(--card-bg)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '20px 24px',
    borderLeft: `3px solid ${accent}`,
    transition: 'box-shadow 0.2s',
  }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)')}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
  >
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>{label}</p>
    <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em' }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{sub}</p>}
    {trend && (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, fontWeight: 600, color: '#22c55e', background: '#22c55e18', padding: '2px 8px', borderRadius: 20 }}>
        <TrendingUp size={10} /> {trend}
      </span>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomerManagement = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!isAdmin) navigate('/'); }, [isAdmin, navigate]);

  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<CustomerFilters>({
    search: '', status: 'all', verified: 'all', dateRange: 'all',
    sortBy: 'joined', sortOrder: 'desc', page: 1, limit: 10
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10, hasNext: false, hasPrevious: false
  });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalCustomers: 0, activeCustomers: 0, newCustomersToday: 0,
    totalRevenue: 0, averageOrderValue: 0, verifiedRate: 0, conversionRate: 0
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const users = await userService.getAllUsers() as User[];
      let customersOnly = users.filter(u => {
        if (Array.isArray(u.roles)) return u.roles.some(r => ['user','customer'].includes(r.toLowerCase()));
        if (typeof u.roles === 'string') return ['user','customer'].includes(u.roles.toLowerCase());
        return false;
      });
      if (!customersOnly.length) {
        customersOnly = users.filter(u => {
          if (Array.isArray(u.roles)) return !u.roles.some(r => ['admin','administrator'].includes(r.toLowerCase()));
          if (typeof u.roles === 'string') return !['admin','administrator'].includes(u.roles.toLowerCase());
          return true;
        });
      }
      let allOrders: Order[] = [];
      try { allOrders = await orderService.getAllOrders(); } catch {}

      const withStats = await Promise.all(customersOnly.map(async c => {
        const orders = allOrders.filter(o => o.userId === c.id);
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const recentOrders = [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 5);
        const addrParts = [c.address, c.city, c.state].filter(Boolean);
        return {
          ...c,
          stats: {
            totalOrders, totalSpent,
            averageOrderValue: totalOrders ? totalSpent / totalOrders : 0,
            lastOrderDate: recentOrders[0]?.orderDate,
            favoriteCategory: 'Living Room',
            reviewCount: 0, returnCount: 0,
            cancellationCount: orders.filter(o => o.status === 'cancelled').length
          },
          recentOrders,
          addressSummary: addrParts.slice(0, 2).join(', ') || undefined
        };
      }));

      let filtered = [...withStats];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.fullName?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phoneNumber?.includes(filters.search)
        );
      }
      if (filters.status !== 'all') filtered = filtered.filter(c => filters.status === 'active' ? c.isActive : !c.isActive);
      if (filters.verified !== 'all') filtered = filtered.filter(c => filters.verified === 'verified' ? c.emailConfirmed : !c.emailConfirmed);
      if (filters.dateRange !== 'all') {
        const cutoff = new Date();
        if (filters.dateRange === 'today') cutoff.setHours(0,0,0,0);
        else if (filters.dateRange === 'week') cutoff.setDate(cutoff.getDate() - 7);
        else if (filters.dateRange === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
        else cutoff.setFullYear(cutoff.getFullYear() - 1);
        filtered = filtered.filter(c => new Date(c.createdAt) >= cutoff);
      }
      filtered.sort((a, b) => {
        let cmp = 0;
        if (filters.sortBy === 'name') cmp = (a.fullName||'').localeCompare(b.fullName||'');
        else if (filters.sortBy === 'email') cmp = a.email.localeCompare(b.email);
        else if (filters.sortBy === 'orders') cmp = (a.stats.totalOrders) - (b.stats.totalOrders);
        else if (filters.sortBy === 'spent') cmp = a.stats.totalSpent - b.stats.totalSpent;
        else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return filters.sortOrder === 'asc' ? cmp : -cmp;
      });

      const total = filtered.length;
      const active = filtered.filter(c => c.isActive).length;
      const verified = filtered.filter(c => c.emailConfirmed).length;
      const today = new Date().toDateString();
      const newToday = filtered.filter(c => new Date(c.createdAt).toDateString() === today).length;
      const revenue = filtered.reduce((s, c) => s + c.stats.totalSpent, 0);
      const withOrders = filtered.filter(c => c.stats.totalOrders > 0).length;
      setQuickStats({
        totalCustomers: total, activeCustomers: active, newCustomersToday: newToday,
        totalRevenue: revenue, averageOrderValue: total ? revenue / total : 0,
        verifiedRate: total ? (verified / total) * 100 : 0,
        conversionRate: total ? (withOrders / total) * 100 : 0
      });

      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      setPagination({
        currentPage: filters.page, totalPages: Math.ceil(total / filters.limit),
        totalItems: total, itemsPerPage: filters.limit,
        hasNext: end < total, hasPrevious: start > 0
      });
      setCustomers(filtered.slice(start, end));
    } catch (e: any) {
      setError(e.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleFilterChange = (key: keyof CustomerFilters, value: any) =>
    setFilters(p => ({ ...p, [key]: value, page: 1 }));

  const handleSort = (col: CustomerFilters['sortBy']) =>
    setFilters(p => ({ ...p, sortBy: col, sortOrder: p.sortBy === col && p.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 }));

  const handleSelectCustomer = (id: string) =>
    setSelectedCustomers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedCustomers(selectAll ? [] : customers.map(c => c.id));
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'email') => {
    if (!selectedCustomers.length) { setError('Select at least one customer'); return; }
    setLoading(true);
    try {
      if (action === 'activate') {
        await Promise.all(selectedCustomers.map(id => userService.toggleUserStatus(id, true)));
        setSuccess(`Activated ${selectedCustomers.length} customer(s)`);
      } else if (action === 'deactivate') {
        await Promise.all(selectedCustomers.map(id => userService.toggleUserStatus(id, false)));
        setSuccess(`Deactivated ${selectedCustomers.length} customer(s)`);
      } else {
        navigate('/admin/email/compose', { state: { recipients: selectedCustomers, type: 'bulk' } });
        return;
      }
      setSelectedCustomers([]); setSelectAll(false); fetchCustomers();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    try {
      const data = selectedCustomers.length ? customers.filter(c => selectedCustomers.includes(c.id)) : customers;
      const headers = ['Name','Email','Phone','Status','Verified','Total Orders','Total Spent','Joined'];
      const rows = data.map(c => [
        c.fullName||'', c.email, c.phoneNumber||'',
        c.isActive?'Active':'Inactive', c.emailConfirmed?'Yes':'No',
        c.stats.totalOrders, c.stats.totalSpent,
        new Date(c.createdAt).toLocaleDateString()
      ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      setSuccess(`Exported ${data.length} customer(s)`);
    } catch (e: any) { setError(e.message); }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await userService.deleteUser(selectedCustomer.id);
      setSuccess('Customer deleted'); setShowDeleteModal(false); setSelectedCustomer(null); fetchCustomers();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── CSS vars injected once ──
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    :root {
      --bg: #f0f4f8;
      --surface: #ffffff;
      --card-bg: #ffffff;
      --border: #dde3ea;
      --border-strong: #c4cdd8;
      --text: #0f1923;
      --muted: #6b7a8d;
      --accent: #0d9488;
      --accent-hover: #0f766e;
    }
    .cm-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
    .cm-root { background: var(--bg); min-height: 100vh; padding: 40px 40px; }
    .cm-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 10px; padding: 9px 16px; cursor: pointer; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .cm-btn-ghost:hover { background: var(--surface); color: var(--text); border-color: var(--border-strong); }
    .cm-btn-primary { background: var(--accent); border: none; color: #fff; border-radius: 10px; padding: 9px 18px; cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 7px; transition: all 0.15s; }
    .cm-btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .cm-input { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 9px 14px; font-size: 13px; color: var(--text); outline: none; transition: border 0.15s; width: 100%; }
    .cm-input:focus { border-color: var(--accent); }
    .cm-select { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 9px 14px; font-size: 13px; color: var(--text); outline: none; cursor: pointer; appearance: none; }
    .cm-select:focus { border-color: var(--accent); }
    .cm-row { transition: background 0.12s; }
    .cm-row:hover { background: var(--bg); }
    .cm-check { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }
    .cm-page-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .cm-page-btn:hover:not(:disabled) { background: var(--surface); border-color: var(--accent); color: var(--accent); }
    .cm-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .cm-page-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .cm-sort-btn { background: none; border: none; display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 0; }
    .cm-sort-btn:hover { color: var(--text); }
    .cm-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .cm-action-btn { background: transparent; border: none; padding: 7px; border-radius: 8px; cursor: pointer; color: var(--muted); transition: all 0.15s; display: flex; }
    .cm-action-btn:hover { background: var(--bg); color: var(--text); }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  `;

  if (loading && !customers.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #dde3ea', borderTopColor: '#0d9488', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ marginTop: 16, fontSize: 13, color: '#78746c' }}>Loading customers…</p>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="cm-root">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', margin: '0 0 5px', letterSpacing: '-0.02em' }}>Customers</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              {quickStats.totalCustomers.toLocaleString()} total · {quickStats.activeCustomers} active · {quickStats.newCustomersToday} joined today
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cm-btn-ghost" onClick={handleExport}><DownloadCloud size={14} /> Export</button>
            <button className="cm-btn-ghost" onClick={fetchCustomers} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <button className="cm-btn-primary" onClick={() => navigate('/admin/customers/new')}>
              <UserPlus size={14} /> Add customer
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Revenue" value={formatCurrency(quickStats.totalRevenue)}
            sub={`${formatCurrency(quickStats.averageOrderValue)} avg`} accent="#0d9488" trend="+12% this month" />
          <StatCard label="Conversion Rate" value={`${quickStats.conversionRate.toFixed(1)}%`}
            sub="visitors who purchased" accent="#0ea5e9" />
          <StatCard label="Verified Rate" value={`${quickStats.verifiedRate.toFixed(1)}%`}
            sub="email confirmed" accent="#22c55e" />
          <StatCard label="Active Today" value={String(quickStats.newCustomersToday)}
            sub="new signups" accent="#f59e0b" />
        </div>

        {/* ── Filters ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="cm-input" style={{ paddingLeft: 34 }}
                placeholder="Search name, email, phone…"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)} />
            </div>
            <div style={{ position: 'relative' }}>
              <select className="cm-select" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} style={{ paddingRight: 28 }}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select className="cm-select" value={filters.verified} onChange={e => handleFilterChange('verified', e.target.value)} style={{ paddingRight: 28 }}>
                <option value="all">All verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select className="cm-select" value={filters.dateRange} onChange={e => handleFilterChange('dateRange', e.target.value)} style={{ paddingRight: 28 }}>
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="year">Last year</option>
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            </div>
            <button className="cm-btn-ghost" onClick={() => setShowFilters(!showFilters)} style={{ borderColor: showFilters ? 'var(--accent)' : 'var(--border)', color: showFilters ? 'var(--accent)' : 'var(--muted)' }}>
              <Filter size={13} /> More
            </button>
          </div>

          {showFilters && (
            <div className="fade-in" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Location</label>
                <input className="cm-input" placeholder="City, State…" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Min. Orders</label>
                <input className="cm-input" type="number" placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Min. Spent</label>
                <input className="cm-input" type="number" placeholder="$0" />
              </div>
            </div>
          )}
        </div>

        {/* ── Bulk Actions ── */}
        {selectedCustomers.length > 0 && (
          <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{selectedCustomers.length} selected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cm-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => handleBulkAction('activate')}>Activate</button>
              <button className="cm-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => handleBulkAction('deactivate')}>Deactivate</button>
              <button className="cm-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => handleBulkAction('email')}><Mail size={12} /> Email</button>
              <button className="cm-btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => { setSelectedCustomers([]); setSelectAll(false); }}><X size={12} /></button>
            </div>
          </div>
        )}

        {/* ── Alerts ── */}
        {error && (
          <div className="fade-in" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={15} color="#ef4444" />
            <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} onClick={() => setError('')}><X size={13} /></button>
          </div>
        )}
        {success && (
          <div className="fade-in" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={15} color="#22c55e" />
            <span style={{ fontSize: 13, color: '#16a34a' }}>{success}</span>
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e' }} onClick={() => setSuccess('')}><X size={13} /></button>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    { w: 48, content: <input type="checkbox" className="cm-check" checked={selectAll} onChange={handleSelectAll} /> },
                    { w: 220, content: <button className="cm-sort-btn" onClick={() => handleSort('name')}>Customer {filters.sortBy === 'name' && <ArrowUpDown size={10} />}</button> },
                    { w: 200, content: <span className="cm-sort-btn" style={{ cursor: 'default' }}>Contact</span> },
                    { w: 100, content: <button className="cm-sort-btn" onClick={() => handleSort('orders')}>Orders {filters.sortBy === 'orders' && <ArrowUpDown size={10} />}</button> },
                    { w: 120, content: <button className="cm-sort-btn" onClick={() => handleSort('spent')}>Spent {filters.sortBy === 'spent' && <ArrowUpDown size={10} />}</button> },
                    { w: 120, content: <button className="cm-sort-btn" onClick={() => handleSort('joined')}>Joined {filters.sortBy === 'joined' && <ArrowUpDown size={10} />}</button> },
                    { w: 100, content: <span className="cm-sort-btn" style={{ cursor: 'default' }}>Status</span> },
                    { w: 90, content: <span className="cm-sort-btn" style={{ cursor: 'default' }}>Tier</span> },
                    { w: 80, content: null },
                  ].map((col, i) => (
                    <th key={i} style={{ padding: '13px 16px', textAlign: 'left', width: col.w, background: 'var(--bg)' }}>{col.content}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => {
                  const tier = getTier(customer.stats.totalSpent);
                  const TierIcon = tier.icon;
                  return (
                    <tr key={customer.id} className="cm-row" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <input type="checkbox" className="cm-check"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar customer={customer} />
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                              {customer.fullName || 'No name'}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                              {customer.id.substring(0, 10)}…
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>{customer.email}</p>
                        {customer.phoneNumber && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={10} />{customer.phoneNumber}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>
                          {customer.stats.totalOrders}
                        </p>
                        {customer.stats.totalOrders > 0 && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                            {formatCurrency(customer.stats.averageOrderValue)} avg
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>
                          {formatCurrency(customer.stats.totalSpent)}
                        </p>
                        {customer.stats.lastOrderDate && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={9} />{formatDate(customer.stats.lastOrderDate)}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>{formatDate(customer.createdAt)}</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="cm-tag" style={{
                          background: customer.isActive ? '#22c55e18' : '#f1f0ec',
                          color: customer.isActive ? '#16a34a' : 'var(--muted)'
                        }}>
                          {customer.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {customer.emailConfirmed && (
                          <p style={{ margin: '5px 0 0', fontSize: 10, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Shield size={9} /> Verified
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="cm-tag" style={{ background: tier.bg, color: tier.color }}>
                          <TierIcon size={10} />{tier.name}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <button className="cm-action-btn" title="View" onClick={() => navigate(`/admin/customers/${customer.id}`)}>
                            <Eye size={14} />
                          </button>
                          <button className="cm-action-btn" title="Edit" onClick={() => navigate(`/admin/customers/edit/${customer.id}`)}>
                            <Edit size={14} />
                          </button>
                          <button className="cm-action-btn" title="Delete"
                            style={{ color: '#f87171' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true); }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty */}
          {!customers.length && !loading && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={22} color="var(--muted)" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>No customers found</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px' }}>Try adjusting your filters</p>
              <button className="cm-btn-primary" onClick={() => navigate('/admin/customers/new')}>
                <UserPlus size={13} /> Add customer
              </button>
            </div>
          )}

          {/* ── Pagination (FIXED) ── */}
          {pagination.totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}–{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
              </span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button 
                  className="cm-page-btn" 
                  disabled={!pagination.hasPrevious} 
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft size={14} />
                </button>
                {(() => {
                  const pages: number[] = [];
                  const t = pagination.totalPages, c = pagination.currentPage;
                  if (t <= 5) for (let i = 1; i <= t; i++) pages.push(i);
                  else if (c <= 3) pages.push(1,2,3,4,5);
                  else if (c >= t - 2) for (let i = t - 4; i <= t; i++) pages.push(i);
                  else for (let i = c - 2; i <= c + 2; i++) pages.push(i);
                  return pages.map(p => (
                    <button 
                      key={p} 
                      className={`cm-page-btn${pagination.currentPage === p ? ' active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button 
                  className="cm-page-btn" 
                  disabled={!pagination.hasNext} 
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Delete Modal ── */}
        {showDeleteModal && selectedCustomer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="fade-in" style={{ background: 'var(--surface)', borderRadius: 18, padding: '28px 32px', maxWidth: 400, width: '100%', border: '1px solid var(--border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Trash2 size={18} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>Delete customer?</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text)' }}>{selectedCustomer.fullName || selectedCustomer.email}</strong> will be permanently removed. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="cm-btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button onClick={handleDeleteCustomer} disabled={loading}
                  style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {loading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default CustomerManagement;