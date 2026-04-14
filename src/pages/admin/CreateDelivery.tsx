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
  MapPin,
  FileText,
  CheckCircle
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';

interface DeliveryItem {
  productId: number;
  productName: string;
  orderedQuantity: number;
  unitPrice: number;
  totalPrice: number;
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
  
  // Delivery items
  const [items, setItems] = useState<DeliveryItem[]>([]);
  
  // Supplier info
  const [supplier, setSupplier] = useState<SupplierInfo>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });
  
  // Delivery details
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Quantity input for modal
  const [quantityInput, setQuantityInput] = useState(1);
  const [priceInput, setPriceInput] = useState(0);

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
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const existingItem = items.find(item => item.productId === selectedProduct.id);
    if (existingItem) {
      showError('Product already added. Remove it first to add again.');
      return;
    }
    
    const newItem: DeliveryItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      orderedQuantity: quantityInput,
      unitPrice: priceInput,
      totalPrice: priceInput * quantityInput,
      notes: ''
    };
    
    setItems([...items, newItem]);
    setSelectedProduct(null);
    setQuantityInput(1);
    setPriceInput(0);
    setShowProductModal(false);
    setSearchTerm('');
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].orderedQuantity = quantity;
    newItems[index].totalPrice = newItems[index].unitPrice * quantity;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].unitPrice = price;
    newItems[index].totalPrice = price * newItems[index].orderedQuantity;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!supplier.name.trim()) {
      showError('Please enter supplier name');
      return;
    }
    
    if (!purchaseOrderNumber.trim()) {
      showError('Please enter purchase order number');
      return;
    }
    
    if (!expectedDate) {
      showError('Please select expected delivery date');
      return;
    }
    
    if (items.length === 0) {
      showError('Please add at least one product');
      return;
    }
    
    // Validate items
    for (const item of items) {
      if (item.orderedQuantity <= 0) {
        showError(`Quantity for ${item.productName} must be greater than 0`);
        return;
      }
      if (item.unitPrice <= 0) {
        showError(`Unit price for ${item.productName} must be greater than 0`);
        return;
      }
    }
    
    setSubmitting(true);
    const loadingToast = showLoading('Creating delivery order...');
    
    try {
      const deliveryData = {
        purchaseOrderNumber,
        supplierName: supplier.name,
        supplierContact: supplier.contactPerson,
        supplierEmail: supplier.email,
        supplierPhone: supplier.phone,
        expectedDate: new Date(expectedDate).toISOString(),
        notes,
        trackingNumber,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          notes: item.notes
        }))
      };
      
      await deliveryService.createDelivery(deliveryData);
      
      dismissToast(loadingToast);
      showSuccess('Delivery order created successfully!');
      navigate('/admin/deliveries');
    } catch (error) {
      dismissToast(loadingToast);
      showError('Failed to create delivery order');
      console.error('Error creating delivery:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.orderedQuantity, 0);
  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/deliveries')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-6 h-6 text-indigo-600" />
                Create Delivery Order
              </h1>
              <p className="text-gray-600 mt-1">Add new stock delivery from supplier</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Delivery Order
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Supplier Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supplier.name}
                    onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={supplier.contactPerson}
                    onChange={(e) => setSupplier({ ...supplier, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={supplier.email}
                    onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="supplier@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={supplier.phone}
                    onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contact number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={supplier.address}
                    onChange={(e) => setSupplier({ ...supplier, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Supplier address"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Delivery Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Order Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="PO-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tracking / Waybill number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Any special instructions or notes"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  Order Items
                  <span className="text-sm font-normal text-gray-500">({items.length} items)</span>
                </h2>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items added yet</p>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add products to this delivery
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.productName}</div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.orderedQuantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                              className="w-32 px-2 py-1 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ₱{item.totalPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-right font-medium">Totals:</td>
                        <td className="px-4 py-3 text-right font-medium">{totalQuantity} units</td>
                        <td className="px-4 py-3 text-right font-bold">₱{totalValue.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium">{items.length} products</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-medium">{totalQuantity} units</span>
                </div>
                <div className="flex justify-between py-2 border-t">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-bold text-indigo-600 text-lg">₱{totalValue.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Stock will be updated upon receipt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Product</h2>
                <p className="text-sm text-gray-500">Select a product to add to this delivery</p>
              </div>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              
              {/* Product List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedProduct?.id === product.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400 m-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">Current Stock: {product.stockQuantity} units</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">₱{product.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Quantity and Price Input */}
              {selectedProduct && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Details for {selectedProduct.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceInput}
                        onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter unit price"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total for this item:</span>
                      <span className="font-bold text-indigo-600">₱{(priceInput * quantityInput).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleAddProduct}
                    disabled={quantityInput <= 0 || priceInput <= 0}
                    className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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