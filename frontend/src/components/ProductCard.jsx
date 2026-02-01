import { useCartStore, useAuthStore } from '../store';
import { FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { addItem, items, updateQuantity, removeItem } = useCartStore();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  
  const cartItem = items.find(item => item.productId === product._id);
  const quantity = cartItem?.quantity || 0;

  const categoryColors = {
    FRUITS: 'bg-red-100 text-red-700',
    SEASONAL: 'bg-yellow-100 text-yellow-700',
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (isAdmin()) {
      toast.error('Admin cannot add items to cart');
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleUpdateQuantity = (newQty) => {
    if (newQty <= 0) {
      removeItem(product._id);
      toast.success(`${product.name} removed from cart`);
    } else if (newQty > product.stock) {
      toast.error(`Only ${product.stock} ${product.unit} available`);
    } else {
      updateQuantity(product._id, newQty);
    }
  };

  return (
    <div className="card card-hover bg-white">
      {/* Product Image/Emoji */}
      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <span className="text-6xl">
          {product.category === 'SEASONAL' ? '🥭' : '🍎'}
        </span>
        
        {/* Stock Badge */}
        {product.stock <= product.lowStockThreshold && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Low Stock
          </span>
        )}
        
        {/* Category Badge */}
        <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded ${categoryColors[product.category] || 'bg-gray-100 text-gray-700'}`}>
          {product.category}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 truncate" title={product.name}>
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold text-green-600">
            ₹{product.pricePerUnit}
          </span>
          <span className="text-sm text-gray-500">
            per {product.unit}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">
          Stock: {product.stock} {product.unit}
        </p>

        {/* Add to Cart / Quantity Controls */}
        {quantity === 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || product.stock === 0}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              product.isAvailable && product.stock > 0
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FiShoppingCart />
            {product.isAvailable && product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        ) : (
          <div className="flex items-center justify-between bg-green-50 rounded-lg p-1">
            <button
              onClick={() => handleUpdateQuantity(quantity - 1)}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-gray-50 text-green-600"
            >
              <FiMinus />
            </button>
            <span className="font-semibold text-green-700">
              {quantity} {product.unit}
            </span>
            <button
              onClick={() => handleUpdateQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-lg text-white hover:bg-green-700"
            >
              <FiPlus />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
