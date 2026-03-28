import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Percent, Users, X, Check } from 'lucide-react';
import { usePromoCodes } from '../../contexts/PromoCodeContext';
import { PromoCode } from '../../types';
import ConfirmationModal from '../../components/ConfirmationModal';

const PromoCodeManagement: React.FC = () => {
  const { state, getAllPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } = usePromoCodes();
  const { promoCodes, loading } = state;
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minimumOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 0,
    perUserLimit: 1,
    isActive: true
  });

  useEffect(() => {
    getAllPromoCodes();
  }, []);

  const handleOpenModal = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minimumOrderAmount: promo.minimumOrderAmount || 0,
        maxDiscountAmount: promo.maxDiscountAmount || 0,
        startDate: promo.startDate.split('T')[0],
        endDate: promo.endDate.split('T')[0],
        usageLimit: promo.usageLimit || 0,
        perUserLimit: promo.perUserLimit || 1,
        isActive: promo.isActive
      });
    } else {
      setEditingPromo(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minimumOrderAmount: 0,
        maxDiscountAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: 0,
        perUserLimit: 1,
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromo) {
        await updatePromoCode(editingPromo.id, formData);
      } else {
        await createPromoCode(formData);
      }
      setShowModal(false);
      getAllPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deletePromoCode(deleteTarget.id);
        setDeleteTarget(null);
        getAllPromoCodes();
      } catch (error) {
        console.error('Error deleting promo code:', error);
      }
    }
  };

  const formatDiscount = (promo: PromoCode) => {
    if (promo.discountType === 'percentage') {
      return `${promo.discountValue}% OFF`;
    }
    return `₱${promo.discountValue.toLocaleString()} OFF`;
  };

  const getStatusBadge = (promo: PromoCode) => {
    const now = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    
    if (!promo.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Disabled</span>;
    }
    if (now < startDate) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">Scheduled</span>;
    }
    if (now > endDate) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">Active</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-600 mt-1">Create and manage promotional codes</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Promo Code
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Codes</p>
              <p className="text-2xl font-bold text-gray-900">{promoCodes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Check className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Codes</p>
              <p className="text-2xl font-bold text-gray-900">
                {promoCodes.filter(p => p.isActive && new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date()).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Uses</p>
              <p className="text-2xl font-bold text-gray-900">
                {promoCodes.reduce((sum, p) => sum + p.usageCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Percent className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Discount</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(promoCodes.reduce((sum, p) => sum + p.discountValue, 0) / (promoCodes.length || 1))}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promoCodes.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-red-600 uppercase">{promo.code}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {promo.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {formatDiscount(promo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {promo.minimumOrderAmount ? `₱${promo.minimumOrderAmount.toLocaleString()}` : 'No minimum'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span>{new Date(promo.startDate).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400">to</span>
                      <span>{new Date(promo.endDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(promo)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(promo)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(promo)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {promoCodes.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No promo codes created yet</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 text-red-600 hover:text-red-700"
            >
              Create your first promo code
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER2024"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Use uppercase letters and numbers only</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this promo code..."
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Order Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Amount
                  </label>
                  <input
                    type="number"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: parseFloat(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave 0 for no minimum</p>
                </div>

                {/* Max Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Discount Amount
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave 0 for no limit</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave 0 for unlimited</p>
                </div>

                {/* Per User Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition"
                >
                  {editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Promo Code"
        message={`Are you sure you want to delete "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default PromoCodeManagement;