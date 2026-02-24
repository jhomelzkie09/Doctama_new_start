import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Truck, MapPin, Lock, ArrowLeft, DollarSign, Smartphone, Wallet, AlertCircle } from 'lucide-react';
import orderService from '../../services/order.service';
import { PaymentMethod } from '../../types';

const Checkout = () => {
  const navigate = useNavigate();
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.fullName || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [gcashNumber, setGcashNumber] = useState('');
  const [paymayaNumber, setPaymayaNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const validatePaymentDetails = (): boolean => {
    if (paymentMethod === 'gcash' && !gcashNumber.trim()) {
      alert('Please enter your GCash number');
      return false;
    }
    if (paymentMethod === 'paymaya' && !paymayaNumber.trim()) {
      alert('Please enter your PayMaya number');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validatePaymentDetails()) return;

    setLoading(true);
    try {
      // Prepare payment details based on method
      const paymentDetails: any = {
        method: paymentMethod
      };

      if (paymentMethod === 'gcash') {
        paymentDetails.gcashNumber = gcashNumber;
      } else if (paymentMethod === 'paymaya') {
        paymentDetails.paymayaNumber = paymayaNumber;
      }

      if (referenceNumber) {
        paymentDetails.referenceNumber = referenceNumber;
      }

      const orderData = {
        totalAmount: state.total,
        shippingAddress: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}`,
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails,
        customerName: shippingInfo.fullName,
        customerEmail: user?.email,
        customerPhone: shippingInfo.phone,
        items: state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      await orderService.createOrder(orderData);
      clearCart();
      navigate('/account/orders?success=true');
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <button
            onClick={() => navigate('/shop')}
            className="text-blue-600 hover:text-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Format currency to PHP
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex mb-8">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="text-sm">Shipping</span>
          </div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="text-sm">Payment</span>
          </div>
          <div className={`flex-1 text-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="text-sm">Review</span>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-blue-600" />
              Shipping Information
            </h2>
            <form onSubmit={handleShippingSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.fullName}
                    onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.zipCode}
                      onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                      placeholder="0917 123 4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Continue to Payment
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              Payment Method
            </h2>
            
            <div className="space-y-4">
              {/* Cash on Delivery */}
              <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-gray-500">Pay when you receive your items</p>
                    </div>
                  </div>
                </div>
              </label>

              {/* GCash */}
              <div className={`border rounded-lg ${paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <label className="flex items-start p-4 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    checked={paymentMethod === 'gcash'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">GCash</p>
                        <p className="text-sm text-gray-500">Pay via GCash mobile wallet</p>
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* GCash Number Input */}
                {paymentMethod === 'gcash' && (
                  <div className="px-4 pb-4 pl-14">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GCash Number
                      </label>
                      <input
                        type="tel"
                        value={gcashNumber}
                        onChange={(e) => setGcashNumber(e.target.value)}
                        placeholder="0917 123 4567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>You will receive an SMS with payment instructions</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PayMaya */}
              <div className={`border rounded-lg ${paymentMethod === 'paymaya' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <label className="flex items-start p-4 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="paymaya"
                    checked={paymentMethod === 'paymaya'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Wallet className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">PayMaya</p>
                        <p className="text-sm text-gray-500">Pay via PayMaya wallet</p>
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* PayMaya Number Input */}
                {paymentMethod === 'paymaya' && (
                  <div className="px-4 pb-4 pl-14">
                    <div className="bg-purple-100 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PayMaya Number
                      </label>
                      <input
                        type="tel"
                        value={paymayaNumber}
                        onChange={(e) => setPaymayaNumber(e.target.value)}
                        placeholder="0917 123 4567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>You will receive a payment request via SMS</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference Number (Optional) */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Enter payment reference number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  If you already made a payment, enter the reference number here
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Review Order
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Your Order</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/60'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-blue-600">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Shipping Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  Shipping Address
                </h3>
                <p className="text-sm text-gray-600">
                  {shippingInfo.fullName}<br />
                  {shippingInfo.address}<br />
                  {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                  {shippingInfo.phone}
                </p>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                  Payment Method
                </h3>
                <div className="flex items-center">
                  {paymentMethod === 'cod' && (
                    <>
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      <p className="text-sm text-gray-600">Cash on Delivery</p>
                    </>
                  )}
                  {paymentMethod === 'gcash' && (
                    <>
                      <Smartphone className="w-5 h-5 text-blue-600 mr-2" />
                      <p className="text-sm text-gray-600">GCash - {gcashNumber}</p>
                    </>
                  )}
                  {paymentMethod === 'paymaya' && (
                    <>
                      <Wallet className="w-5 h-5 text-purple-600 mr-2" />
                      <p className="text-sm text-gray-600">PayMaya - {paymayaNumber}</p>
                    </>
                  )}
                </div>
                {referenceNumber && (
                  <p className="text-sm text-gray-500 mt-2">
                    Reference: {referenceNumber}
                  </p>
                )}
              </div>

              {/* Order Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>{formatCurrency(state.total)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(state.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;