import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/user.service';
import orderService from '../../services/order.service';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, ShoppingBag, DollarSign,
  Package, CreditCard, Edit, Trash2, AlertCircle, CheckCircle, XCircle,
  Shield, Home, Star, Clock, TrendingUp, User as UserIcon, Lock,
  RefreshCw, Plus, Send, Ban, Filter, Eye, Save, Award, Heart,
  LogOut, Smartphone, FileText, Bell, Tag, X, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { User, Order, OrderStatus } from '../../types';

interface CustomerDetail extends User {
  stats: {
    totalOrders: number; totalSpent: number; averageOrderValue: number;
    firstOrderDate?: string; lastOrderDate?: string;
    favoriteCategory?: string; favoriteProduct?: string;
    reviewCount: number; returnCount: number; cancellationCount: number;
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  recentOrders: Order[];
  activityLog: ActivityLog[];
  wishlist?: WishlistItem[];
  addresses: AddressWithId[];
  paymentMethods?: PaymentMethod[];
  notes?: AdminNote[];
}

interface ActivityLog {
  id: string;
  type: 'order' | 'login' | 'profile_update' | 'password_change' | 'review' | 'support' | 'email' | 'note';
  description: string;
  timestamp: string;
  metadata?: any;
  user?: string;
}

interface AddressWithId {
  id: string; type: 'shipping' | 'billing'; isDefault: boolean;
  fullName: string; addressLine1: string; addressLine2?: string;
  city: string; state: string; postalCode: string; country: string; phoneNumber?: string;
}

interface WishlistItem {
  id: string; productId: number; productName: string; productImage: string;
  price: number; addedAt: string; inStock: boolean;
}

interface PaymentMethod {
  id: string; type: 'card' | 'gcash' | 'paymaya'; last4?: string;
  expiryDate?: string; isDefault: boolean; name?: string;
}

interface AdminNote {
  id: string; content: string; createdAt: string; createdBy: string; isPrivate: boolean;
}

interface OrderFilters {
  status: string; dateRange: string; search: string; paymentStatus: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d?: string) => !d ? 'N/A' : new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const formatRelativeTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return formatDate(d);
};
const formatCurrency = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

const getTier = (tier: string) => {
  switch (tier) {
    case 'platinum': return { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Platinum' };
    case 'gold': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Gold' };
    case 'silver': return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Silver' };
    default: return { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: 'Bronze' };
  }
};

const getOrderStatusStyle = (status: string) => {
  switch (status) {
    case 'delivered': return { color: '#16a34a', bg: '#22c55e18' };
    case 'shipped': return { color: '#0284c7', bg: '#0ea5e918' };
    case 'processing': return { color: '#b45309', bg: '#f59e0b18' };
    case 'pending': return { color: '#78746c', bg: 'var(--bg)' };
    case 'cancelled': return { color: '#dc2626', bg: '#ef444418' };
    case 'awaiting_payment': return { color: '#ea580c', bg: '#f9731618' };
    default: return { color: '#78746c', bg: 'var(--bg)' };
  }
};

const getPaymentStatusStyle = (status: string) => {
  switch (status) {
    case 'paid': return { color: '#16a34a', bg: '#22c55e18' };
    case 'pending': return { color: '#b45309', bg: '#f59e0b18' };
    case 'failed': return { color: '#dc2626', bg: '#ef444418' };
    case 'refunded': return { color: '#7c3aed', bg: '#8b5cf618' };
    default: return { color: '#78746c', bg: 'var(--bg)' };
  }
};

const activityIconColor = (type: string) => {
  switch (type) {
    case 'order': return { color: '#0284c7', bg: '#0ea5e918' };
    case 'login': return { color: '#16a34a', bg: '#22c55e18' };
    case 'email': return { color: '#7c3aed', bg: '#8b5cf618' };
    case 'note': return { color: '#b45309', bg: '#f59e0b18' };
    case 'profile_update': return { color: '#5b47e0', bg: '#6366f118' };
    default: return { color: '#78746c', bg: 'var(--bg)' };
  }
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ customer, size = 64 }: { customer: any; size?: number }) => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b'];
  const c = colors[(customer?.email?.charCodeAt(0) || 0) % colors.length];
  const initial = (customer?.fullName || customer?.email || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${c}18`, border: `2px solid ${c}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: c, fontFamily: "'DM Mono', monospace",
      overflow: 'hidden'
    }}>
      {customer?.profileImage
        ? <img src={customer.profileImage} alt={customer.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial}
    </div>
  );
};

// ─── Modal Shell ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div className="cd-fade-in" style={{ background: 'var(--surface)', borderRadius: 18, maxWidth: 480, width: '100%', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}><X size={16} /></button>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  </div>
);

// ─── Tag ────────────────────────────────────────────────────────────────────
const Tag = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg }}>{label}</span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'activity' | 'wishlist' | 'notes'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteIsPrivate, setNoteIsPrivate] = useState(true);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({ status: 'all', dateRange: 'all', search: '', paymentStatus: 'all' });
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', firstName: '', lastName: '', phoneNumber: '', email: '' });

  useEffect(() => { if (!isAdmin) navigate('/'); }, [isAdmin, navigate]);

  const fetchCustomerDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const userData = await userService.getUserById(id) as User;
      if (!userData.roles || (Array.isArray(userData.roles) && !userData.roles.length)) {
        setError('User has no roles assigned'); setLoading(false); return;
      }
      let orders: Order[] = [];
      try {
        const all = await orderService.getAllOrders();
        orders = all.filter(o => o.userId === id || o.userId === userData.email);
      } catch {}

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const sorted = [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (totalSpent > 10000) tier = 'platinum';
      else if (totalSpent > 5000) tier = 'gold';
      else if (totalSpent > 1000) tier = 'silver';

      const activityLog: ActivityLog[] = [
        ...orders.map(o => ({ id: `order-${o.id}`, type: 'order' as const, description: `Placed order #${o.orderNumber} for ${formatCurrency(o.totalAmount)}`, timestamp: o.orderDate })),
        { id: 'login-1', type: 'login' as const, description: 'Logged in from new device', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { id: 'profile-1', type: 'profile_update' as const, description: 'Updated profile information', timestamp: new Date(Date.now() - 172800000).toISOString() }
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const addresses: AddressWithId[] = userData.address ? [{
        id: '1', type: 'shipping', isDefault: true, fullName: userData.fullName || 'Customer',
        addressLine1: userData.address, addressLine2: '', city: userData.city || '',
        state: userData.state || '', postalCode: userData.zipCode || '',
        country: userData.country || 'Philippines', phoneNumber: userData.phoneNumber
      }] : [];

      const wishlist: WishlistItem[] = [
        { id: '1', productId: 1, productName: 'Modern Sofa', productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', price: 12999, addedAt: new Date(Date.now() - 604800000).toISOString(), inStock: true },
        { id: '2', productId: 2, productName: 'Dining Table Set', productImage: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400', price: 15999, addedAt: new Date(Date.now() - 1209600000).toISOString(), inStock: true },
        { id: '3', productId: 3, productName: 'Bed Frame', productImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400', price: 18999, addedAt: new Date(Date.now() - 1814400000).toISOString(), inStock: false }
      ];

      const paymentMethods: PaymentMethod[] = [
        { id: 'pm1', type: 'gcash', name: 'GCash', isDefault: true },
        { id: 'pm2', type: 'card', last4: '4242', expiryDate: '12/25', isDefault: false }
      ];

      const notes: AdminNote[] = [
        { id: 'note1', content: 'Customer requested follow-up on order #12345', createdAt: new Date(Date.now() - 172800000).toISOString(), createdBy: 'Admin User', isPrivate: true },
        { id: 'note2', content: 'Offered 10% discount on next purchase', createdAt: new Date(Date.now() - 259200000).toISOString(), createdBy: 'Admin User', isPrivate: false }
      ];

      const data: CustomerDetail = {
        ...userData,
        stats: {
          totalOrders, totalSpent, averageOrderValue: totalOrders ? totalSpent / totalOrders : 0,
          firstOrderDate: sorted[sorted.length - 1]?.orderDate, lastOrderDate: sorted[0]?.orderDate,
          favoriteCategory: 'Living Room', favoriteProduct: 'Modern Sofa',
          reviewCount: 3, returnCount: 1, cancellationCount: orders.filter(o => o.status === 'cancelled').length,
          loyaltyTier: tier
        },
        recentOrders: sorted, activityLog, wishlist, addresses, paymentMethods, notes
      };

      setCustomer(data);
      setFilteredOrders(sorted);
      setEditForm({ fullName: userData.fullName || '', firstName: userData.firstName || '', lastName: userData.lastName || '', phoneNumber: userData.phoneNumber || '', email: userData.email });
    } catch (e: any) {
      setError(e.message || 'Failed to load customer');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchCustomerDetails(); }, [fetchCustomerDetails]);

  useEffect(() => {
    if (!customer?.recentOrders) return;
    let f = [...customer.recentOrders];
    if (orderFilters.status !== 'all') f = f.filter(o => o.status === orderFilters.status);
    if (orderFilters.paymentStatus !== 'all') f = f.filter(o => o.paymentStatus === orderFilters.paymentStatus);
    if (orderFilters.dateRange !== 'all') {
      const cut = new Date();
      if (orderFilters.dateRange === 'today') cut.setHours(0,0,0,0);
      else if (orderFilters.dateRange === 'week') cut.setDate(cut.getDate() - 7);
      else if (orderFilters.dateRange === 'month') cut.setMonth(cut.getMonth() - 1);
      else cut.setFullYear(cut.getFullYear() - 1);
      f = f.filter(o => new Date(o.orderDate) >= cut);
    }
    if (orderFilters.search) {
      const q = orderFilters.search.toLowerCase();
      f = f.filter(o => o.orderNumber.toLowerCase().includes(q) || String(o.totalAmount).includes(q));
    }
    setFilteredOrders(f);
  }, [customer?.recentOrders, orderFilters]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      await userService.toggleUserStatus(customer.id, !customer.isActive);
      setCustomer(p => p ? { ...p, isActive: !p.isActive } : null);
      setSuccess(`Customer ${customer.isActive ? 'deactivated' : 'activated'}`);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      await userService.deleteUser(customer.id);
      setSuccess('Customer deleted'); setTimeout(() => navigate('/admin/customers'), 1500);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setShowDeleteModal(false); }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setSuccess('Password reset email sent'); setShowResetPasswordModal(false);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !customer) return;
    const note: AdminNote = { id: `note-${Date.now()}`, content: newNote, createdAt: new Date().toISOString(), createdBy: currentUser?.fullName || 'Admin', isPrivate: noteIsPrivate };
    const act: ActivityLog = { id: `act-${Date.now()}`, type: 'note', description: `Note: ${newNote.substring(0, 50)}…`, timestamp: new Date().toISOString(), user: currentUser?.fullName || 'Admin' };
    setCustomer({ ...customer, notes: [...(customer.notes || []), note], activityLog: [act, ...customer.activityLog] });
    setNewNote(''); setShowNoteModal(false); setSuccess('Note added');
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailMessage.trim() || !customer) return;
    const act: ActivityLog = { id: `email-${Date.now()}`, type: 'email', description: `Email: ${emailSubject}`, timestamp: new Date().toISOString(), user: currentUser?.fullName || 'Admin' };
    setCustomer({ ...customer, activityLog: [act, ...customer.activityLog] });
    setEmailSubject(''); setEmailMessage(''); setShowEmailModal(false); setSuccess('Email sent');
  };

  const handleSaveEdit = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      setCustomer({ ...customer, ...editForm });
      setIsEditing(false); setSuccess('Customer updated');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'orders', label: `Orders (${customer?.stats.totalOrders || 0})` },
    { key: 'addresses', label: `Addresses (${customer?.addresses.length || 0})` },
    { key: 'wishlist', label: `Wishlist (${customer?.wishlist?.length || 0})` },
    { key: 'activity', label: 'Activity' },
    { key: 'notes', label: `Notes (${customer?.notes?.length || 0})` },
  ];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    :root {
      --bg: #f8f7f5; --surface: #ffffff; --card-bg: #ffffff;
      --border: #e8e5e0; --border-strong: #d0cdc8;
      --text: #1a1916; --muted: #78746c; --accent: #5b47e0; --accent-hover: #4836c8;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111110; --surface: #1c1b19; --card-bg: #1c1b19;
        --border: #2e2c28; --border-strong: #3d3a34;
        --text: #f0ede8; --muted: #8a8680; --accent: #7c6ff7; --accent-hover: #9389f9;
      }
    }
    .cd-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
    .cd-root { background: var(--bg); min-height: 100vh; padding: 36px 40px; }
    .cd-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 10px; padding: 8px 14px; cursor: pointer; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .cd-btn-ghost:hover { background: var(--surface); color: var(--text); border-color: var(--border-strong); }
    .cd-btn-primary { background: var(--accent); border: none; color: #fff; border-radius: 10px; padding: 8px 16px; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .cd-btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .cd-btn-danger { background: #ef4444; border: none; color: #fff; border-radius: 10px; padding: 8px 16px; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .cd-btn-danger:hover { background: #dc2626; }
    .cd-input { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 9px 13px; font-size: 13px; color: var(--text); outline: none; transition: border 0.15s; width: 100%; }
    .cd-input:focus { border-color: var(--accent); }
    .cd-select { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 8px 13px; font-size: 12px; color: var(--text); outline: none; cursor: pointer; appearance: none; }
    .cd-tab { padding: 12px 18px; font-size: 13px; font-weight: 500; border: none; background: transparent; cursor: pointer; color: var(--muted); border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
    .cd-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .cd-tab:hover:not(.active) { color: var(--text); }
    .cd-row:hover { background: var(--bg); }
    .cd-action-btn { background: transparent; border: none; padding: 6px; border-radius: 7px; cursor: pointer; color: var(--muted); transition: all 0.15s; display: inline-flex; }
    .cd-action-btn:hover { background: var(--bg); color: var(--text); }
    .cd-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
    .cd-stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; transition: box-shadow 0.2s; }
    .cd-stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .cd-fade-in { animation: cdFade 0.25s ease; }
    @keyframes cdFade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
    .cd-timeline-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  `;

  if (loading && !customer) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e8e5e0', borderTopColor: '#5b47e0', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ marginTop: 14, fontSize: 13, color: '#78746c' }}>Loading customer…</p>
    </div>
  );

  if (!customer && !loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{css}</style>
      <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>Customer not found</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px' }}>This customer doesn't exist or was deleted.</p>
      <button className="cd-btn-primary" onClick={() => navigate('/admin/customers')}><ArrowLeft size={13} /> Back to Customers</button>
    </div>
  );

  const tier = getTier(customer?.stats.loyaltyTier || 'bronze');

  return (
    <>
      <style>{css}</style>
      <div className="cd-root">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="cd-btn-ghost" style={{ padding: '8px 10px' }} onClick={() => navigate('/admin/customers')}>
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Customer Profile</h1>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>ID: <span style={{ fontFamily: "'DM Mono', monospace" }}>{id?.substring(0, 16)}…</span></p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="cd-btn-ghost" onClick={() => setShowEmailModal(true)}><Mail size={13} /> Email</button>
            <button className="cd-btn-ghost" onClick={() => setShowNoteModal(true)}><FileText size={13} /> Note</button>
            <button className="cd-btn-ghost" onClick={() => setShowResetPasswordModal(true)}><Lock size={13} /> Reset PW</button>
            {!isEditing
              ? <button className="cd-btn-primary" onClick={() => setIsEditing(true)}><Edit size={13} /> Edit</button>
              : <button className="cd-btn-primary" onClick={handleSaveEdit}><Save size={13} /> Save</button>}
            <button
              className="cd-btn-ghost"
              onClick={handleToggleStatus}
              style={{ color: customer?.isActive ? '#f59e0b' : '#22c55e', borderColor: customer?.isActive ? '#f59e0b44' : '#22c55e44' }}>
              {customer?.isActive ? <><Ban size={13} /> Deactivate</> : <><CheckCircle size={13} /> Activate</>}
            </button>
            <button className="cd-btn-ghost" style={{ color: '#ef4444', borderColor: '#ef444430' }} onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="cd-fade-in" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={14} color="#ef4444" />
            <span style={{ fontSize: 13, color: '#dc2626', flex: 1 }}>{error}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} onClick={() => setError('')}><X size={13} /></button>
          </div>
        )}
        {success && (
          <div className="cd-fade-in" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '11px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={14} color="#22c55e" />
            <span style={{ fontSize: 13, color: '#16a34a', flex: 1 }}>{success}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e' }} onClick={() => setSuccess('')}><X size={13} /></button>
          </div>
        )}

        {/* ── Top Grid: Profile + Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, marginBottom: 20 }}>

          {/* Profile Card */}
          <div className="cd-card" style={{ padding: '24px 20px' }}>
            {!isEditing ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
                  <Avatar customer={customer} size={72} />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '14px 0 4px' }}>{customer?.fullName || 'No name'}</h2>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>{customer?.email}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: customer?.isActive ? '#22c55e18' : 'var(--bg)', color: customer?.isActive ? '#16a34a' : 'var(--muted)' }}>
                      {customer?.isActive ? <CheckCircle size={9} /> : <XCircle size={9} />}
                      {customer?.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: tier.bg, color: tier.color }}>
                      {tier.label}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: <Phone size={13} />, text: customer?.phoneNumber },
                    { icon: <Mail size={13} />, text: customer?.email },
                    { icon: <Calendar size={13} />, text: `Joined ${formatDate(customer?.createdAt)}` },
                    { icon: <Clock size={13} />, text: customer?.lastLogin ? `Last login ${formatRelativeTime(customer.lastLogin)}` : null },
                    { icon: <MapPin size={13} />, text: [customer?.city, customer?.country].filter(Boolean).join(', ') || null }
                  ].filter(r => r.text).map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: 'var(--muted)', marginTop: 1, flexShrink: 0 }}>{row.icon}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{row.text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  {customer?.emailConfirmed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Shield size={12} color="#0284c7" />
                      <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 500 }}>Email verified</span>
                    </div>
                  )}
                  {customer?.paymentMethods?.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {m.type === 'gcash' ? <Smartphone size={12} color="#0284c7" /> : <CreditCard size={12} color="var(--muted)" />}
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {m.type === 'gcash' ? 'GCash' : m.type === 'paymaya' ? 'PayMaya' : `Card ····${m.last4}`}
                      </span>
                      {m.isDefault && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Default</span>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 16px' }}>Edit customer</p>
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text' },
                  { label: 'Phone', key: 'phoneNumber', type: 'tel' },
                  { label: 'Email', key: 'email', type: 'email' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input className="cd-input" type={f.type} value={(editForm as any)[f.key]}
                      onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {['firstName', 'lastName'].map(k => (
                    <div key={k}>
                      <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{k === 'firstName' ? 'First' : 'Last'}</label>
                      <input className="cd-input" value={(editForm as any)[k]} onChange={e => setEditForm({ ...editForm, [k]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="cd-btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsEditing(false)}>Cancel</button>
                  <button className="cd-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveEdit}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* Stats + Quick Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Total Orders', value: String(customer?.stats.totalOrders || 0), sub: `First: ${formatDate(customer?.stats.firstOrderDate)}`, accent: '#5b47e0' },
                { label: 'Total Spent', value: formatCurrency(customer?.stats.totalSpent || 0), sub: `Avg ${formatCurrency(customer?.stats.averageOrderValue || 0)}`, accent: '#22c55e' },
                { label: 'Reviews · Returns', value: `${customer?.stats.reviewCount} · ${customer?.stats.returnCount}`, sub: `${customer?.stats.cancellationCount} cancellations`, accent: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="cd-stat-card" style={{ borderLeft: `3px solid ${s.accent}` }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>{s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', fontFamily: "'DM Mono', monospace", letterSpacing: '-0.02em' }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent quick orders */}
            <div className="cd-card" style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Recent Orders</p>
                <button style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setActiveTab('orders')}>View all</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Order #','Date','Amount','Status'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</th>
                    ))}
                    <th style={{ padding: '9px 16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {customer?.recentOrders.slice(0, 3).map(order => {
                    const st = getOrderStatusStyle(order.status);
                    return (
                      <tr key={order.id} className="cd-row" style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>#{order.orderNumber}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--muted)' }}>{formatDate(order.orderDate)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{formatCurrency(order.totalAmount)}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, color: st.color, background: st.bg }}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          <button className="cd-action-btn" onClick={() => navigate(`/admin/orders/${order.id}`)}><Eye size={12} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {!customer?.recentOrders.length && (
                    <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="cd-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto', padding: '0 8px' }}>
            {TABS.map(t => (
              <button key={t.key} className={`cd-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key as any)}>{t.label}</button>
            ))}
          </div>

          <div style={{ padding: '24px' }}>

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Address */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 14px' }}>Default Address</p>
                  {customer?.addresses.length ? (
                    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px', display: 'flex', gap: 12 }}>
                      <Home size={14} color="var(--muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{customer.fullName}</p>
                        <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--muted)' }}>{customer.address}</p>
                        {customer.city && <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--muted)' }}>{customer.city}, {customer.state} {customer.zipCode}</p>}
                        {customer.country && <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{customer.country}</p>}
                      </div>
                    </div>
                  ) : <p style={{ fontSize: 13, color: 'var(--muted)' }}>No address saved</p>}
                </div>

                {/* Favourite Product */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 14px' }}>Favourite Product</p>
                  <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, background: 'var(--border)', borderRadius: 10 }} />
                    <div>
                      <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{customer?.stats.favoriteProduct}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{customer?.stats.favoriteCategory}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Notes */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 14px' }}>Latest Note</p>
                  {customer?.notes?.[0] ? (
                    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{customer.notes[0].content}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{customer.notes[0].createdBy} · {formatRelativeTime(customer.notes[0].createdAt)}</p>
                    </div>
                  ) : <p style={{ fontSize: 13, color: 'var(--muted)' }}>No notes yet</p>}
                </div>

                {/* Recent Activity */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 14px' }}>Recent Activity</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {customer?.activityLog.slice(0, 3).map(a => {
                      const ac = activityIconColor(a.type);
                      return (
                        <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div className="cd-timeline-dot" style={{ background: ac.color, marginTop: 5 }} />
                          <div>
                            <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--text)' }}>{a.description}</p>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{formatRelativeTime(a.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Orders ── */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Order History</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input className="cd-input" style={{ width: 180 }} placeholder="Search orders…" value={orderFilters.search} onChange={e => setOrderFilters({ ...orderFilters, search: e.target.value })} />
                    {[
                      { key: 'status', options: [['all','All status'],['pending','Pending'],['processing','Processing'],['shipped','Shipped'],['delivered','Delivered'],['cancelled','Cancelled']] },
                      { key: 'paymentStatus', options: [['all','All payment'],['pending','Pending'],['paid','Paid'],['failed','Failed'],['refunded','Refunded']] },
                      { key: 'dateRange', options: [['all','All time'],['today','Today'],['week','Last 7 days'],['month','Last 30 days']] }
                    ].map(f => (
                      <div key={f.key} style={{ position: 'relative' }}>
                        <select className="cd-select" value={(orderFilters as any)[f.key]} onChange={e => setOrderFilters({ ...orderFilters, [f.key]: e.target.value })} style={{ paddingRight: 26 }}>
                          {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                      </div>
                    ))}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {['Order #','Date','Items','Total','Status','Payment','Method',''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const st = getOrderStatusStyle(order.status);
                      const ps = getPaymentStatusStyle(order.paymentStatus);
                      return (
                        <tr key={order.id} className="cd-row" style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>#{order.orderNumber}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--muted)' }}>{formatDate(order.orderDate)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--muted)' }}>{order.items?.length || 0}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{formatCurrency(order.totalAmount)}</td>
                          <td style={{ padding: '11px 14px' }}><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, color: st.color, background: st.bg }}>{order.status.replace('_',' ')}</span></td>
                          <td style={{ padding: '11px 14px' }}><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, color: ps.color, background: ps.bg }}>{order.paymentStatus}</span></td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{order.paymentMethod}</td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <button className="cd-action-btn" onClick={() => navigate(`/admin/orders/${order.id}`)}><Eye size={13} /></button>
                            <button className="cd-action-btn" onClick={() => navigate(`/admin/orders/edit/${order.id}`)}><Edit size={13} /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredOrders.length && (
                      <tr><td colSpan={8} style={{ padding: '48px 14px', textAlign: 'center' }}>
                        <Package size={28} color="var(--border)" style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>No orders found</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>

                {filteredOrders.length > 0 && (
                  <div style={{ marginTop: 16, background: 'var(--bg)', borderRadius: 12, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {[
                      ['Total Orders', filteredOrders.length],
                      ['Total Spent', formatCurrency(filteredOrders.reduce((s, o) => s + o.totalAmount, 0))],
                      ['Delivered', filteredOrders.filter(o => o.status === 'delivered').length],
                      ['Pending', filteredOrders.filter(o => ['pending','processing'].includes(o.status)).length],
                    ].map(([l, v]) => (
                      <div key={l as string}>
                        <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</p>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Addresses ── */}
            {activeTab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Saved Addresses</p>
                  <button className="cd-btn-primary"><Plus size={13} /> Add Address</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {customer?.addresses.length ? customer.addresses.map(addr => (
                    <div key={addr.id} style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px', border: addr.isDefault ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>{addr.type}</span>
                        {addr.isDefault && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)' }}>Default</span>}
                      </div>
                      <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{addr.fullName}</p>
                      <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--muted)' }}>{addr.addressLine1}</p>
                      <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--muted)' }}>{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--muted)' }}>{addr.country}</p>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', padding: 0, fontWeight: 500 }}>Edit</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ef4444', padding: 0, fontWeight: 500 }}>Delete</button>
                      </div>
                    </div>
                  )) : (
                    <div style={{ gridColumn: '1/-1', padding: '48px 0', textAlign: 'center' }}>
                      <MapPin size={28} color="var(--border)" style={{ display: 'block', margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>No addresses saved</p>
                      <button className="cd-btn-primary"><Plus size={13} /> Add Address</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Wishlist ── */}
            {activeTab === 'wishlist' && (
              <div>
                <p style={{ margin: '0 0 18px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Wishlist Items</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {customer?.wishlist?.length ? customer.wishlist.map(item => (
                    <div key={item.id} style={{ background: 'var(--bg)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ height: 140, position: 'relative', overflow: 'hidden' }}>
                        <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {!item.inStock && (
                          <span style={{ position: 'absolute', top: 8, right: 8, background: '#ef444490', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>Out of stock</span>
                        )}
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.productName}</p>
                        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{formatCurrency(item.price)}</p>
                        <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted)' }}>Added {formatRelativeTime(item.addedAt)}</p>
                        <button className="cd-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}>Add to cart</button>
                      </div>
                    </div>
                  )) : (
                    <div style={{ gridColumn: '1/-1', padding: '48px 0', textAlign: 'center' }}>
                      <Heart size={28} color="var(--border)" style={{ display: 'block', margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>No wishlist items</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Activity ── */}
            {activeTab === 'activity' && (
              <div>
                <p style={{ margin: '0 0 18px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Activity Log</p>
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
                  {customer?.activityLog.map((a, i) => {
                    const ac = activityIconColor(a.type);
                    return (
                      <div key={a.id} style={{ position: 'relative', marginBottom: 20 }}>
                        <div style={{ position: 'absolute', left: -20, top: 4, width: 8, height: 8, borderRadius: '50%', background: ac.color, border: `2px solid var(--surface)` }} />
                        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', flex: 1 }}>{a.description}</p>
                            {a.user && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 10, flexShrink: 0 }}>by {a.user}</span>}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--muted)' }}>{formatRelativeTime(a.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Notes ── */}
            {activeTab === 'notes' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Admin Notes</p>
                  <button className="cd-btn-primary" onClick={() => setShowNoteModal(true)}><Plus size={13} /> Add Note</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {customer?.notes?.length ? customer.notes.map(note => (
                    <div key={note.id} style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', borderLeft: note.isPrivate ? '3px solid #f59e0b' : '3px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{note.createdBy}</span>
                          {note.isPrivate && <span style={{ fontSize: 10, fontWeight: 600, color: '#b45309', background: '#f59e0b18', padding: '2px 8px', borderRadius: 20 }}>Private</span>}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatRelativeTime(note.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{note.content}</p>
                    </div>
                  )) : (
                    <div style={{ padding: '48px 0', textAlign: 'center' }}>
                      <FileText size={28} color="var(--border)" style={{ display: 'block', margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>No notes yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Add Note Modal ── */}
      {showNoteModal && (
        <Modal title="Add Note" onClose={() => setShowNoteModal(false)}>
          <textarea className="cd-input" rows={4} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Enter note…" style={{ resize: 'vertical', marginBottom: 12 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
            <input type="checkbox" checked={noteIsPrivate} onChange={e => setNoteIsPrivate(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Private (admin only)</span>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="cd-btn-ghost" onClick={() => setShowNoteModal(false)}>Cancel</button>
            <button className="cd-btn-primary" onClick={handleAddNote} disabled={!newNote.trim()} style={{ opacity: newNote.trim() ? 1 : 0.5 }}>Add Note</button>
          </div>
        </Modal>
      )}

      {/* ── Email Modal ── */}
      {showEmailModal && (
        <Modal title={`Email ${customer?.email}`} onClose={() => setShowEmailModal(false)}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Subject</label>
            <input className="cd-input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Email subject…" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea className="cd-input" rows={6} value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Type your message…" style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="cd-btn-ghost" onClick={() => setShowEmailModal(false)}>Cancel</button>
            <button className="cd-btn-primary" onClick={handleSendEmail} disabled={!emailSubject.trim() || !emailMessage.trim()} style={{ opacity: emailSubject.trim() && emailMessage.trim() ? 1 : 0.5 }}><Send size={13} /> Send</button>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <Modal title="Delete Customer" onClose={() => setShowDeleteModal(false)}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={20} color="#ef4444" />
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text)' }}>{customer?.fullName || customer?.email}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button className="cd-btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="cd-btn-danger" onClick={handleDeleteCustomer} disabled={loading}>{loading ? 'Deleting…' : 'Delete Customer'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reset PW Modal ── */}
      {showResetPasswordModal && (
        <Modal title="Reset Password" onClose={() => setShowResetPasswordModal(false)}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={20} color="#0284c7" />
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.7 }}>
              Send a password reset email to <strong style={{ color: 'var(--text)' }}>{customer?.email}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button className="cd-btn-ghost" onClick={() => setShowResetPasswordModal(false)}>Cancel</button>
              <button className="cd-btn-primary" onClick={handleResetPassword}><Send size={13} /> Send Email</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CustomerDetail;