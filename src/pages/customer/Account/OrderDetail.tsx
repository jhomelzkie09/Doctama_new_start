import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import orderService from '../../../services/order.service';
import {
  Package,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  User,
  CreditCard,
  Receipt,
  Download,
  AlertCircle,
  Loader
} from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrderById(Number(id));
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'shipped': return <Truck className="w-6 h-6 text-blue-500" />;
      case 'processing': return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'pending': return <Clock className="w-6 h-6 text-gray-500" />;
      case 'cancelled': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Package className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? currentIndex + 1 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <button
            onClick={() => navigate('/account/orders')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/account/orders')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
              <p className="text-gray-500 mt-1">Placed on {formatDate(order.orderDate)}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {/* Order Progress Tracker */}
          <div className="mt-8 mb-6">
            <div className="flex items-center justify-between">
              {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, index) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index + 1 <= statusStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-xs mt-2 text-gray-600">{step}</span>
                  </div>
                  {index < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      index + 1 < statusStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 py-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400 m-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-500">Unit Price: {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Payment Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Payment Proof */}
              {(order as any).paymentProofImage && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Payment Proof</p>
                  <div className="relative group cursor-pointer" onClick={() => setShowReceiptModal(true)}>
                    <img
                      src={(order as any).paymentProofImage}
                      alt="Payment receipt"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition rounded-lg flex items-center justify-center">
                      <Receipt className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Shipping Address
              </h3>
              <p className="text-sm text-gray-600">{order.shippingAddress}</p>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Customer Details
              </h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-gray-500">Name:</span> {order.customerName}</p>
                <p className="text-sm"><span className="text-gray-500">Email:</span> {order.customerEmail}</p>
                <p className="text-sm"><span className="text-gray-500">Phone:</span> {order.customerPhone}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {order.status === 'delivered' && (
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </button>
                )}
                {order.status === 'pending' && (
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Order
                  </button>
                )}
                <Link
                  to="/contact"
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Need Help?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (order as any).paymentProofImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowReceiptModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <img
            src={(order as any).paymentProofImage}
            alt="Receipt full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetail;