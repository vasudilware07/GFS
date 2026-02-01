import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTruck, FiShield, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '../store';
import { orderAPI } from '../api';
import { ButtonLoading } from '../components/Loading';

// COD convenience fee
const COD_FEE = 10;

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  const navigate = useNavigate();
  
  const total = getTotal();
  const gstAmount = total * 0.18;
  const convenienceFee = paymentMethod === 'COD' ? COD_FEE : 0;
  const finalTotal = total + gstAmount + convenienceFee;

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async (orderData) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Please try again.');
      return false;
    }

    return new Promise((resolve) => {
      const options = {
        key: orderData.razorpay.key,
        amount: orderData.razorpay.amount,
        currency: orderData.razorpay.currency,
        name: 'LBR Fruit Suppliers',
        description: 'Order Payment',
        order_id: orderData.razorpay.orderId,
        handler: async (response) => {
          try {
            // Verify payment on backend
            await orderAPI.verifyPayment(orderData.order._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve(true);
          } catch (error) {
            toast.error('Payment verification failed');
            resolve(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            resolve(false);
          }
        },
        prefill: {
          name: 'Customer',
          email: '',
          contact: ''
        },
        theme: {
          color: '#16a34a'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(productId);
      toast.success('Item removed from cart');
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to place an order');
      navigate('/login?redirect=/cart');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const res = await orderAPI.create({
        items: orderItems,
        notes,
        paymentMethod,
      });

      // If Razorpay payment method, open payment gateway
      if (paymentMethod === 'RAZORPAY' && res.data.data.razorpay) {
        const paymentSuccess = await handleRazorpayPayment(res.data.data);
        if (paymentSuccess) {
          clearCart();
          toast.success('Payment successful! Order placed.');
          navigate(`/orders/${res.data.data.order._id}`);
        }
      } else {
        clearCart();
        toast.success('Order placed successfully!');
        // Handle both response structures
        const orderId = res.data.data.order?._id || res.data.data._id;
        navigate(`/orders/${orderId}`);
      }
    } catch (error) {
      console.error('Order error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <FiShoppingBag className="w-16 h-16 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some fresh fruits to get started!</p>
        <Link to="/products" className="btn-primary px-8 py-3">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart ({items.length} items)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200'}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.productId}`} className="font-semibold text-gray-900 hover:text-green-600 line-clamp-2">
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{item.category || 'Fresh Fruits'}</p>
                    <p className="text-lg font-bold text-green-600 mt-2">
                      ₹{(item.pricePerUnit || 0).toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-500">per {item.unit}</span>
                    </p>

                    {/* Quantity Controls - Mobile */}
                    <div className="flex items-center justify-between mt-4 md:hidden">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.productId);
                          toast.success('Item removed');
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity Controls - Desktop */}
                  <div className="hidden md:flex flex-col items-end gap-4">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        removeItem(item.productId);
                        toast.success('Item removed');
                      }}
                      className="flex items-center gap-1 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Remove
                    </button>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{((item.pricePerUnit || 0) * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <button
              onClick={() => {
                clearCart();
                toast.success('Cart cleared');
              }}
              className="text-red-500 hover:text-red-600 font-medium"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Items Summary */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1">{item.name} × {item.quantity}</span>
                    <span className="font-medium ml-2">₹{((item.pricePerUnit || 0) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                {convenienceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">COD Fee</span>
                    <span className="font-medium">₹{convenienceFee}</span>
                  </div>
                )}
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="text-green-600">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                <div className="space-y-2">
                  {/* Credit (Pay Later) */}
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'CREDIT' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CREDIT"
                      checked={paymentMethod === 'CREDIT'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FiCreditCard className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Credit (Pay Later)</p>
                      <p className="text-xs text-gray-500">Add to your credit account</p>
                    </div>
                    {paymentMethod === 'CREDIT' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </label>

                  {/* Pay Online (Razorpay) */}
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'RAZORPAY' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="RAZORPAY"
                      checked={paymentMethod === 'RAZORPAY'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#6366f1">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Pay Online</p>
                      <p className="text-xs text-gray-500">UPI, Cards, Net Banking, Wallets</p>
                    </div>
                    {paymentMethod === 'RAZORPAY' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </label>

                  {/* COD */}
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                      <FiDollarSign className="text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">+₹{COD_FEE} convenience fee</p>
                    </div>
                    {paymentMethod === 'COD' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <ButtonLoading />
                ) : (
                  <>
                    Place Order <FiArrowRight />
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FiTruck className="text-green-600" />
                  Free delivery on orders above ₹5,000
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiShield className="text-green-600" />
                  100% Quality Guaranteed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
