import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/product.service';
import deliveryService from '../../services/delivery.service';
import { Product } from '../../types';
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Save,
  X,
  AlertCircle,
  Loader,
  Search,
  Truck,
  Calendar,
  User,
  Mail,
  Phone,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';

interface ReceivedItem {
  productId: number;
  productName: string;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  updateSellingPrice: boolean;
  newSellingPrice?: number;
  currentSellingPrice?: number;
  suggestedSellingPrice?: number;
  notes?: string;
}

interface SupplierInfo {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

const CreateDelivery = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  
  // Received items
  const [items, setItems] = useState<ReceivedItem[]>([]);
  
  // Supplier info
  const [supplier, setSupplier] = useState<SupplierInfo>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });
  
  // Delivery details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Quantity and cost input for modal
  const [quantityInput, setQuantityInput] = useState(1);
  const [costInput, setCostInput] = useState(0);
  const [updatePriceInput, setUpdatePriceInput] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadProducts();
  }, [isAdmin, navigate]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
      showError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !items.some(item => item.productId === product.id)
  );

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const suggestedPrice = costInput * 1.3; // 30% markup
    
    const newItem: ReceivedItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      receivedQuantity: quantityInput,
      unitCost: costInput,
      totalCost: costInput * quantityInput,
      updateSellingPrice: updatePriceInput,
      newSellingPrice: updatePriceInput ? newPriceInput || suggestedPrice : undefined,
      currentSellingPrice: selectedProduct.price,
      suggestedSellingPrice: suggestedPrice,
      notes: ''
    };
    
    setItems([...items, newItem]);
    setSelectedProduct(null);
    setQuantityInput(1);
    setCostInput(0);
    setUpdatePriceInput(false);
    setNewPriceInput(0);
    setShowProductModal(false);
    setSearchTerm('');
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    if (expandedItem === index) setExpandedItem(null);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].receivedQuantity = quantity;
    newItems[index].totalCost = newItems[index].unitCost * quantity;
    setItems(newItems);
  };

  const updateItemCost = (index: number, cost: number) => {
    const newItems = [...items];
    newItems[index].unitCost = cost;
    newItems[index].totalCost = cost * newItems[index].receivedQuantity;
    
    // Update suggested price based on new cost
    const product = products.find(p => p.id === newItems[index].productId);
    if (product) {
      newItems[index].suggestedSellingPrice = cost * 1.3;
      if (newItems[index].updateSellingPrice) {
        newItems[index].newSellingPrice = cost * 1.3;
      }
    }
    
    setItems(newItems);
  };

  const togglePriceUpdate = (index: number, enabled: boolean) => {
    const newItems = [...items];
    newItems[index].updateSellingPrice = enabled;
    if (enabled && !newItems[index].newSellingPrice) {
      newItems[index].newSellingPrice = newItems[index].suggestedSellingPrice;
    }
    setItems(newItems);
  };

  const updateNewPrice = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].newSellingPrice = price;
    setItems(newItems);
  };

  const calculateMarkup = (cost: number, selling: number) => {
    if (cost === 0) return 0;
    return ((selling - cost) / cost) * 100;
  };

  const handleSubmit = async () => {
  // Validate form
  if (!supplier.name.trim()) {
    showError('Please enter supplier name');
    return;
  }
  
  if (!invoiceNumber.trim()) {
    showError('Please enter invoice/reference number');
    return;
  }
  
  if (!deliveryDate) {
    showError('Please select delivery date');
    return;
  }
  
  if (items.length === 0) {
    showError('Please add at least one product received');
    return;
  }
  
  // Validate items
  for (const item of items) {
    if (item.receivedQuantity <= 0) {
      showError(`Quantity for ${item.productName} must be greater than 0`);
      return;
    }
    if (item.unitCost <= 0) {
      showError(`Unit cost for ${item.productName} must be greater than 0`);
      return;
    }
  }
  
  setSubmitting(true);
  const loadingToast = showLoading('Recording stock delivery...');
  
  try {
    // Create delivery record
    const deliveryData = {
      purchaseOrderNumber: invoiceNumber,
      supplierName: supplier.name,
      supplierContact: supplier.contactPerson,
      supplierEmail: supplier.email,
      supplierPhone: supplier.phone,
      deliveryDate: new Date(deliveryDate).toISOString(),
      expectedDate: new Date(deliveryDate).toISOString(),
      notes,
      trackingNumber,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        orderedQuantity: item.receivedQuantity,
        receivedQuantity: item.receivedQuantity,
        unitPrice: item.unitCost,
        notes: item.notes
      }))
    };
    
    const createdDelivery = await deliveryService.createDelivery(deliveryData);
    
    // Immediately receive the delivery
    // Use createdDelivery.id or createdDelivery.deliveryId depending on what the API returns
    const deliveryId = (createdDelivery as any).deliveryId || (createdDelivery as any).id;
    
    await deliveryService.receiveDelivery(deliveryId, items.map(item => ({
      productId: item.productId,
      receivedQuantity: item.receivedQuantity
    })));
    
    // Update product prices for items marked for update
    const priceUpdatePromises = items
      .filter(item => item.updateSellingPrice && item.newSellingPrice)
      .map(async item => {
        const product = products.find(p => p.id === item.productId);
        if (product && item.newSellingPrice) {
          return productService.updateProduct(item.productId, {
            ...product,
            price: item.newSellingPrice
          });
        }
        return Promise.resolve();
      });
    
    await Promise.all(priceUpdatePromises);
    
    const updatedPriceCount = items.filter(i => i.updateSellingPrice).length;
    
    dismissToast(loadingToast);
    
    if (updatedPriceCount > 0) {
      showSuccess(`Stock received! ${items.length} product(s) added to inventory. ${updatedPriceCount} price(s) updated.`);
    } else {
      showSuccess(`Stock received! ${items.length} product(s) added to inventory.`);
    }
    
    navigate('/admin/deliveries');
  } catch (error) {
    dismissToast(loadingToast);
    showError('Failed to record stock delivery');
    console.error('Error recording delivery:', error);
  } finally {
    setSubmitting(false);
  }
};

  const totalQuantity = items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const itemsToUpdatePrice = items.filter(i => i.updateSellingPrice).length;

  const formatCurrency = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-stone-400" />
          <p className="text-sm text-stone-400 tracking-wide">Loading products…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/deliveries')}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-stone-500" />
            </button>
            <div>
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-stone-400 mb-1">Inventory</p>
              <h1 className="text-3xl font-light text-stone-900 tracking-tight flex items-center gap-3">
                <Truck className="w-7 h-7 text-stone-600" />
                Record Stock Delivery
              </h1>
              <p className="text-sm text-stone-500 mt-1">Record products received from supplier and update inventory</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition disabled:opacity-50"
          >
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Record Delivery
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Information */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-medium text-stone-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-stone-400" />
                Supplier Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supplier.name}
                    onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={supplier.contactPerson}
                    onChange={(e) => setSupplier({ ...supplier, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={supplier.email}
                    onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="supplier@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={supplier.phone}
                    onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="Contact number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Address
                  </label>
                  <textarea
                    value={supplier.address}
                    onChange={(e) => setSupplier({ ...supplier, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="Supplier address"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-medium text-stone-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                Delivery Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Invoice / Reference # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="INV-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Delivery Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="Tracking / Waybill number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="Any additional notes"
                  />
                </div>
              </div>
            </div>

            {/* Received Items */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-medium text-stone-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-stone-400" />
                  Products Received
                  <span className="text-xs font-normal text-stone-400">({items.length} items)</span>
                </h2>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl">
                  <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm text-stone-400">No products added yet</p>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="mt-3 text-stone-600 hover:text-stone-800 text-xs font-medium"
                  >
                    + Add received products
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="border border-stone-200 rounded-xl p-4">
                      {/* Item Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-stone-800">{item.productName}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-stone-400">Current Stock: {products.find(p => p.id === item.productId)?.stockQuantity || 0} units</p>
                            <p className="text-xs text-stone-400">Current Price: {formatCurrency(item.currentSellingPrice || 0)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                            className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition"
                          >
                            {expandedItem === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quantity and Cost Inputs - Always visible */}
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs text-stone-400 mb-1">Quantity Received</label>
                          <input
                            type="number"
                            min="1"
                            value={item.receivedQuantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-400 mb-1">Unit Cost</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₱</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => updateItemCost(index, parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 pr-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-200"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs text-stone-400">Item Total: </span>
                        <span className="text-sm font-medium text-stone-700 font-mono">{formatCurrency(item.totalCost)}</span>
                      </div>

                      {/* Price Update Section - Expandable */}
                      {expandedItem === index && (
                        <div className="mt-4 pt-4 border-t border-stone-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`update-price-${index}`}
                                checked={item.updateSellingPrice}
                                onChange={(e) => togglePriceUpdate(index, e.target.checked)}
                                className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-200"
                              />
                              <label htmlFor={`update-price-${index}`} className="text-sm text-stone-700 cursor-pointer flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                                Update selling price
                              </label>
                            </div>
                            {item.updateSellingPrice && (
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Will update
                              </span>
                            )}
                          </div>

                          {item.updateSellingPrice && (
                            <div className="pl-6 space-y-3">
                              <div className="flex items-center gap-4">
                                <div>
                                  <label className="block text-xs text-stone-400 mb-1">New Selling Price</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₱</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.newSellingPrice || ''}
                                      onChange={(e) => updateNewPrice(index, parseFloat(e.target.value) || 0)}
                                      className="w-32 pl-7 pr-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-200 font-mono"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-stone-400 mb-1">Markup</label>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium text-stone-700">
                                      {item.newSellingPrice && item.unitCost > 0 
                                        ? `${Math.round(calculateMarkup(item.unitCost, item.newSellingPrice))}%`
                                        : '—'}
                                    </span>
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                  </div>
                                </div>
                                <button
                                  onClick={() => item.suggestedSellingPrice && updateNewPrice(index, item.suggestedSellingPrice)}
                                  className="text-xs text-stone-500 hover:text-stone-700 underline"
                                >
                                  Use suggested (30%)
                                </button>
                              </div>
                              {item.currentSellingPrice && item.newSellingPrice && (
                                <p className="text-xs text-stone-400">
                                  Current: {formatCurrency(item.currentSellingPrice)} 
                                  <span className={`ml-2 ${item.newSellingPrice > item.currentSellingPrice ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ({item.newSellingPrice > item.currentSellingPrice ? '+' : ''}
                                    {formatCurrency(item.newSellingPrice - item.currentSellingPrice)})
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-medium text-stone-800 mb-4">Delivery Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-xs text-stone-400">Products Received:</span>
                  <span className="text-sm font-medium text-stone-700">{items.length} items</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-stone-400">Total Quantity:</span>
                  <span className="text-sm font-medium text-stone-700">{totalQuantity} units</span>
                </div>
                <div className="flex justify-between py-2 border-t border-stone-100">
                  <span className="text-xs text-stone-400">Total Cost:</span>
                  <span className="text-base font-medium text-stone-900 font-mono">{formatCurrency(totalCost)}</span>
                </div>
              </div>
              
              {itemsToUpdatePrice > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2 text-xs">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-stone-500">
                      <span className="font-medium text-emerald-600">{itemsToUpdatePrice}</span> price{itemsToUpdatePrice > 1 ? 's' : ''} will be updated
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Stock quantities will be updated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl border border-stone-100">
            <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-5 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Add Received Product</h2>
                <p className="text-xs text-stone-400 mt-0.5">Select a product that was delivered</p>
              </div>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                  setSearchTerm('');
                  setQuantityInput(1);
                  setCostInput(0);
                  setUpdatePriceInput(false);
                  setNewPriceInput(0);
                }}
                className="p-2 hover:bg-stone-50 rounded-xl transition"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  autoFocus
                />
              </div>
              
              {/* Product List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setCostInput(product.price * 0.7); // Default cost = 70% of selling price
                        setNewPriceInput(product.price);
                      }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedProduct?.id === product.id
                          ? 'border-stone-400 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-stone-800">{product.name}</h3>
                          <p className="text-xs text-stone-400">Stock: {product.stockQuantity} units • Price: {formatCurrency(product.price)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Quantity, Cost, and Price Update Input */}
              {selectedProduct && (
                <div className="border-t border-stone-100 pt-4">
                  <h3 className="text-sm font-medium text-stone-800 mb-3">Delivery Details for {selectedProduct.name}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">
                          Quantity Received <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">
                          Unit Cost <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₱</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={costInput}
                            onChange={(e) => setCostInput(parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-stone-50 rounded-xl">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-stone-400">Total Cost:</span>
                        <span className="text-sm font-medium text-stone-700 font-mono">{formatCurrency(costInput * quantityInput)}</span>
                      </div>
                    </div>

                    {/* Price Update Option */}
                    <div className="border-t border-stone-100 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          id="modal-update-price"
                          checked={updatePriceInput}
                          onChange={(e) => {
                            setUpdatePriceInput(e.target.checked);
                            if (e.target.checked && !newPriceInput) {
                              setNewPriceInput(costInput * 1.3);
                            }
                          }}
                          className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-200"
                        />
                        <label htmlFor="modal-update-price" className="text-sm text-stone-700 cursor-pointer flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                          Update selling price based on new cost
                        </label>
                      </div>

                      {updatePriceInput && (
                        <div className="pl-6 space-y-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="block text-xs text-stone-400 mb-1">New Selling Price</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₱</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={newPriceInput || ''}
                                  onChange={(e) => setNewPriceInput(parseFloat(e.target.value) || 0)}
                                  className="w-32 pl-7 pr-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-200 font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-stone-400 mb-1">Markup</label>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-stone-700">
                                  {newPriceInput && costInput > 0 
                                    ? `${Math.round(calculateMarkup(costInput, newPriceInput))}%`
                                    : '—'}
                                </span>
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                            </div>
                            <button
                              onClick={() => setNewPriceInput(costInput * 1.3)}
                              className="text-xs text-stone-500 hover:text-stone-700 underline"
                            >
                              Suggest 30% markup
                            </button>
                          </div>
                          <p className="text-xs text-stone-400">
                            Current price: {formatCurrency(selectedProduct.price)}
                            {newPriceInput && (
                              <span className={`ml-2 ${newPriceInput > selectedProduct.price ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ({newPriceInput > selectedProduct.price ? '+' : ''}
                                {formatCurrency(newPriceInput - selectedProduct.price)})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddProduct}
                    disabled={quantityInput <= 0 || costInput <= 0}
                    className="mt-6 w-full py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    Add to Delivery
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDelivery;