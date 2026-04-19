import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/user.service';
import orderService from '../../services/order.service';
import {
  Users, Search, RefreshCw, Eye, Edit, Trash2,
  Phone, DollarSign, AlertCircle, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, UserPlus, X, MapPin, Package
} from 'lucide-react';
import { User, Order } from '../../types';

interface CustomerWithStats extends User {
  stats: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: string;
  };
  recentOrders: Order[];
  addressSummary?: string;
}

interface CustomerFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
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

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

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
      fontSize: 14, fontWeight: 600, color: colors[idx], fontFamily: "'DM Mono', monospace"
    }}>
      {initial}
      {customer.isActive && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 8, height: 8, background: '#22c55e',
          borderRadius: '50%', border: '2px solid white'
        }} />
      )}
    </div>
  );
};

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
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  const [filters, setFilters] = useState<CustomerFilters>({
    search: '', status: 'all', page: 1, limit: 10
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10, hasNext: false, hasPrevious: false
  });
  const [totalStats, setTotalStats] = useState({ totalCustomers: 0, activeCustomers: 0, totalRevenue: 0 });

  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Fetch all users
      const users = await userService.getAllUsers() as User[];
      
      // Filter to customers only (exclude admins)
      let customersOnly = users.filter(u => {
        if (Array.isArray(u.roles)) {
          return !u.roles.some(r => ['admin','administrator'].includes(r.toLowerCase()));
        }
        if (typeof u.roles === 'string') {
          return !['admin','administrator'].includes(u.roles.toLowerCase());
        }
        return true;
      });

      // Fetch all orders for stats
      let allOrders: Order[] = [];
      try { allOrders = await orderService.getAllOrders(); } catch {}

      // Calculate stats for each customer
      const withStats = customersOnly.map(c => {
        const orders = allOrders.filter(o => o.userId === c.id || o.customerEmail === c.email);
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const recentOrders = [...orders].sort((a, b) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        ).slice(0, 5);
        const addrParts = [c.address, c.city, c.state].filter(Boolean);
        
        return {
          ...c,
          stats: {
            totalOrders,
            totalSpent,
            lastOrderDate: recentOrders[0]?.orderDate
          },
          recentOrders,
          addressSummary: addrParts.join(', ') || 'No address'
        };
      });

      // Apply filters
      let filtered = [...withStats];
      
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.fullName?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phoneNumber?.includes(filters.search)
        );
      }
      
      if (filters.status !== 'all') {
        filtered = filtered.filter(c => filters.status === 'active' ? c.isActive : !c.isActive);
      }

      // Calculate totals
      const total = filtered.length;
      const active = filtered.filter(c => c.isActive).length;
      const revenue = filtered.reduce((s, c) => s + c.stats.totalSpent, 0);
      
      setTotalStats({
        totalCustomers: total,
        activeCustomers: active,
        totalRevenue: revenue
      });

      // Pagination
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      
      setPagination({
        currentPage: filters.page,
        totalPages: Math.ceil(total / filters.limit),
        totalItems: total,
        itemsPerPage: filters.limit,
        hasNext: end < total,
        hasPrevious: start > 0
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

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await userService.deleteUser(selectedCustomer.id);
      setSuccess('Customer deleted successfully');
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (e: any) {
      setError(e.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer: CustomerWithStats) => {
    try {
      await userService.toggleUserStatus(customer.id, !customer.isActive);
      setSuccess(`Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCustomers();
    } catch (e: any) {
      setError(e.message || 'Failed to update status');
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --accent: #0f172a;
    }
    .cm-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
    .cm-root { background: var(--bg); min-height: 100vh; padding: 32px 32px; }
    .cm-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .cm-btn:hover { background: var(--bg); }
    .cm-btn-primary { background: var(--accent); border: none; color: #fff; }
    .cm-btn-primary:hover { background: #1e293b; }
    .cm-input { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; font-size: 13px; color: var(--text); outline: none; width: 100%; }
    .cm-input:focus { border-color: var(--accent); }
    .cm-select { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; font-size: 13px; color: var(--text); outline: none; cursor: pointer; }
    .cm-row:hover { background: var(--bg); }
    .cm-page-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .cm-page-btn:hover:not(:disabled) { background: var(--surface); border-color: var(--accent); }
    .cm-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .cm-page-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .cm-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .cm-action-btn { background: transparent; border: none; padding: 7px; border-radius: 6px; cursor: pointer; color: var(--muted); display: flex; }
    .cm-action-btn:hover { background: var(--bg); color: var(--text); }
    .fade-in { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    .spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  if (loading && !customers.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0f172a', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>Loading customers…</p>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="cm-root">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Customers</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              {totalStats.totalCustomers} total · {totalStats.activeCustomers} active · {formatCurrency(totalStats.totalRevenue)} revenue
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cm-btn" onClick={fetchCustomers} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="cm-input" style={{ paddingLeft: 34 }}
                placeholder="Search name, email, phone…"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)} />
            </div>
            <select className="cm-select" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(filters.search || filters.status !== 'all') && (
              <button className="cm-btn" onClick={() => setFilters({ search: '', status: 'all', page: 1, limit: 10 })}>
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
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

        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spent</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id} className="cm-row" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar customer={customer} />
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            {customer.fullName || 'No name'}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                            {customer.addressSummary || 'No address'}
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
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        {customer.stats.totalOrders}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        {formatCurrency(customer.stats.totalSpent)}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>{formatDate(customer.createdAt)}</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="cm-tag" style={{
                        background: customer.isActive ? '#22c55e18' : '#f1f5f9',
                        color: customer.isActive ? '#16a34a' : 'var(--muted)'
                      }}>
                        {customer.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <button className="cm-action-btn" title="View Details" onClick={() => { setSelectedCustomer(customer); setShowCustomerDetails(true); }}>
                          <Eye size={14} />
                        </button>
                        <button className="cm-action-btn" title={customer.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(customer)}>
                          {customer.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button className="cm-action-btn" title="Delete" style={{ color: '#ef4444' }}
                          onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true); }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {!customers.length && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={20} color="var(--muted)" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>No customers found</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}–{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="cm-page-btn" disabled={!pagination.hasPrevious} onClick={() => handlePageChange(filters.page - 1)}>
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
                    <button key={p} className={`cm-page-btn${pagination.currentPage === p ? ' active' : ''}`} onClick={() => handlePageChange(p)}>
                      {p}
                    </button>
                  ));
                })()}
                <button className="cm-page-btn" disabled={!pagination.hasNext} onClick={() => handlePageChange(filters.page + 1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Details Modal */}
        {showCustomerDetails && selectedCustomer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="fade-in" style={{ background: 'var(--surface)', borderRadius: 16, padding: '24px 28px', maxWidth: 500, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Customer Details</h2>
                <button onClick={() => setShowCustomerDetails(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} color="var(--muted)" />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <Avatar customer={selectedCustomer} />
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{selectedCustomer.fullName || 'No name'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>{selectedCustomer.email}</p>
                  {selectedCustomer.phoneNumber && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>{selectedCustomer.phoneNumber}</p>}
                </div>
              </div>

              {/* Address Section */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="var(--muted)" /> Address
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', background: 'var(--bg)', padding: '12px 14px', borderRadius: 8 }}>
                  {selectedCustomer.address || 'No address provided'}<br />
                  {selectedCustomer.city && `${selectedCustomer.city}, `}{selectedCustomer.state} {selectedCustomer.zipCode}
                </p>
              </div>

              {/* Orders Section */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={14} color="var(--muted)" /> Recent Orders
                </h3>
                {selectedCustomer.recentOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedCustomer.recentOrders.slice(0, 5).map(order => (
                      <div key={order.id} style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>#{order.orderNumber?.slice(-8) || order.id}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{formatDate(order.orderDate)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(order.totalAmount)}</p>
                          <span className="cm-tag" style={{ background: order.status === 'delivered' ? '#22c55e18' : '#f59e0b18', color: order.status === 'delivered' ? '#16a34a' : '#d97706', marginTop: 4 }}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: 8 }}>
                    No orders yet
                  </p>
                )}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="cm-btn" onClick={() => setShowCustomerDetails(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedCustomer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="fade-in" style={{ background: 'var(--surface)', borderRadius: 16, padding: '24px 28px', maxWidth: 400, width: '100%' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Trash2 size={18} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>Delete customer?</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>
                <strong>{selectedCustomer.fullName || selectedCustomer.email}</strong> will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="cm-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button onClick={handleDeleteCustomer} disabled={loading}
                  style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
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