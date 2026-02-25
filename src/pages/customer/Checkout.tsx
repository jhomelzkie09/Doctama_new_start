import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  ArrowLeft, 
  DollarSign, 
  Smartphone, 
  Wallet, 
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import orderService from '../../services/order.service';
import uploadService from '../../services/upload.service';
import { PaymentMethod } from '../../types';

const Checkout = () => {
  const navigate = useNavigate();
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Shipping Info
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.fullName || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  
  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  
  // Receipt Upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setReceiptFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlaceOrder = async () => {
  if (!validatePaymentDetails()) return;

  setLoading(true);
  setUploadProgress(0);

  try {
    // Upload receipt if exists
    let receiptImageUrl = '';
    if (receiptFile) {
      console.log('📤 Uploading receipt...');
      const uploadedUrls = await uploadService.uploadImages([receiptFile]);
      receiptImageUrl = uploadedUrls[0];
      console.log('✅ Receipt uploaded:', receiptImageUrl);
      setUploadProgress(100);
    }

    // Create order with payment proof
    const orderData: any = {
      totalAmount: state.total,
      shippingAddress: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}`,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      customerName: shippingInfo.fullName,
      customerEmail: user?.email,
      customerPhone: shippingInfo.phone,
      items: state.items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    };

    // Add payment proof for non-COD orders
    if (paymentMethod !== 'cod' && receiptImageUrl) {
      orderData.paymentProofImage = receiptImageUrl;
      orderData.paymentProofReference = referenceNumber;
      orderData.paymentProofSender = senderName;
      orderData.paymentProofDate = paymentDate;
      orderData.paymentProofNotes = paymentNotes;
      
      console.log('📦 Sending order with payment proof:', {
        paymentProofImage: receiptImageUrl,
        paymentProofReference: referenceNumber,
        paymentProofSender: senderName,
        paymentProofDate: paymentDate,
        paymentProofNotes: paymentNotes
      });
    }

    console.log('📤 Sending order data:', orderData);
    
    const order = await orderService.createOrder(orderData);
    console.log('✅ Order created:', order);
    
    clearCart();
    navigate(`/account/orders/${order.id}?success=true`);
    
  } catch (error) {
    console.error('❌ Order failed:', error);
    alert('Failed to place order. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const validatePaymentDetails = (): boolean => {
    if (paymentMethod === 'cod') {
      return true;
    }

    if (!receiptFile) {
      alert('Please upload a screenshot of your payment receipt');
      return false;
    }
    if (!referenceNumber) {
      alert('Please enter the reference number');
      return false;
    }
    if (!senderName) {
      alert('Please enter the sender name');
      return false;
    }
    if (!paymentDate) {
      alert('Please select payment date');
      return false;
    }
    return true;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
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
              <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 mr-3"
                />
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive your items</p>
                  </div>
                </div>
              </label>

              {/* GCash */}
              <div className={`border rounded-lg ${
                paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <label className="flex items-start p-4 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    checked={paymentMethod === 'gcash'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">GCash</p>
                      <p className="text-sm text-gray-500">Pay via GCash and upload receipt</p>
                    </div>
                  </div>
                </label>
                
                {/* GCash Number Input */}
                {paymentMethod === 'gcash' && (
                  <div className="px-4 pb-4 pl-14">
                    <input
                      type="tel"
                      placeholder="GCash Number (Optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* PayMaya */}
              <div className={`border rounded-lg ${
                paymentMethod === 'paymaya' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}>
                <label className="flex items-start p-4 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="paymaya"
                    checked={paymentMethod === 'paymaya'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">PayMaya</p>
                      <p className="text-sm text-gray-500">Pay via PayMaya and upload receipt</p>
                    </div>
                  </div>
                </label>
                
                {/* PayMaya Number Input */}
                {paymentMethod === 'paymaya' && (
                  <div className="px-4 pb-4 pl-14">
                    <input
                      type="tel"
                      placeholder="PayMaya Number (Optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Receipt Upload Section - Only for GCash/PayMaya */}
              {paymentMethod !== 'cod' && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Upload Payment Proof</h3>
                  
                  <div className="space-y-4">
                    {/* Receipt Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Screenshot of Payment Receipt *
                      </label>
                      {!receiptPreview ? (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload receipt screenshot</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <img 
                            src={receiptPreview} 
                            alt="Receipt preview" 
                            className="w-full max-h-64 object-contain bg-gray-50 rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={removeReceipt}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reference Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Number *
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g., 1234 5678 9012"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Sender Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sender Name *
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Name on the transaction"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Date *
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        rows={3}
                        placeholder="Any additional information about your payment"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                      <p className="text-sm text-gray-600">GCash</p>
                    </>
                  )}
                  {paymentMethod === 'paymaya' && (
                    <>
                      <Wallet className="w-5 h-5 text-purple-600 mr-2" />
                      <p className="text-sm text-gray-600">PayMaya</p>
                    </>
                  )}
                </div>

                {/* Payment Proof Summary */}
                {paymentMethod !== 'cod' && receiptPreview && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Proof Provided:</h4>
                    <div className="flex items-start gap-3">
                      <img 
                        src={receiptPreview} 
                        alt="Receipt" 
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                      <div className="text-sm">
                        <p><span className="text-gray-500">Reference:</span> {referenceNumber}</p>
                        <p><span className="text-gray-500">Sender:</span> {senderName}</p>
                        <p><span className="text-gray-500">Date:</span> {paymentDate}</p>
                        {paymentNotes && <p className="text-gray-500 mt-1">{paymentNotes}</p>}
                      </div>
                    </div>
                  </div>
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

              {/* Status Note */}
              {paymentMethod !== 'cod' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Your order will be processed after admin verifies your payment proof.
                  </p>
                </div>
              )}
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