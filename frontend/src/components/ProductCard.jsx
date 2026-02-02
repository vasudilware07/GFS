import { useState, useRef } from 'react';
import { useCartStore, useAuthStore } from '../store';
import { FiShoppingCart, FiPlus, FiMinus, FiVideo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

export default function ProductCard({ product }) {
  const { addItem, items, updateQuantity, removeItem } = useCartStore();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sliderRef = useRef(null);
  
  const cartItem = items.find(item => item.productId === product._id);
  const quantity = cartItem?.quantity || 0;

  const categoryColors = {
    FRUITS: 'bg-red-100 text-red-700',
    SEASONAL: 'bg-yellow-100 text-yellow-700',
  };

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Combine images and videos for carousel
  const images = product.images?.map(img => ({ type: 'image', url: getMediaUrl(img) })) || [];
  const videos = product.videos?.map(vid => ({ 
    type: 'video', 
    url: getMediaUrl(vid.url || vid),
    thumbnail: vid.thumbnail ? getMediaUrl(vid.thumbnail) : null
  })) || [];
  const allMedia = [...images, ...videos];
  const totalSlides = allMedia.length;

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
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
      {/* Product Image/Video Carousel */}
      <div className="relative">
        <Link to={`/products/${product._id}`}>
          <div 
            ref={sliderRef}
            className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {totalSlides > 0 ? (
              <div 
                className="flex h-full transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {allMedia.map((media, index) => (
                  <div key={index} className="min-w-full h-full flex-shrink-0">
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        draggable="false"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-black/50 rounded-full p-2">
                            <FiVideo className="w-6 h-6 text-white" />
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">
                  {product.category === 'SEASONAL' ? '🥭' : '🍎'}
                </span>
              </div>
            )}
            
            {/* Stock Badge */}
            {product.stock <= product.lowStockThreshold && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
                Low Stock
              </span>
            )}
            
            {/* Category Badge */}
            <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded z-10 ${categoryColors[product.category] || 'bg-gray-100 text-gray-700'}`}>
              {product.category}
            </span>

            {/* Media count badge */}
            {totalSlides > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                {currentSlide + 1}/{totalSlides}
              </span>
            )}
          </div>
        </Link>

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-1 z-20 transition-all"
              >
                <FiChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}
            {currentSlide < totalSlides - 1 && (
              <button
                onClick={nextSlide}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-1 z-20 transition-all"
              >
                <FiChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            )}
          </>
        )}

        {/* Dot Indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {allMedia.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToSlide(index); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-3' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 truncate hover:text-green-600" title={product.name}>
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold text-green-600">
            ₹{product.pricePerUnit || product.price}
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
