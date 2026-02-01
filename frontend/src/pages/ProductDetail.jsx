import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiMinus, FiPlus, FiTruck, FiShield, FiPackage, FiArrowLeft } from 'react-icons/fi';
import { productAPI } from '../api';
import { useCartStore } from '../store';
import { PageLoading } from '../components/Loading';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem, items } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await productAPI.getOne(id);
      setProduct(res.data.data);
    } catch (error) {
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Added ${quantity} ${product.unit} of ${product.name} to cart`);
  };

  const isInCart = items.some(item => item.productId === product?._id);

  if (loading) return <PageLoading />;
  if (!product) return null;

  const images = product.images?.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
        >
          <FiArrowLeft /> Back to products
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-green-600' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Category */}
              <span className="text-sm text-green-600 font-medium">{product.category}</span>
              
              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
              
              {/* SKU */}
              {product.sku && (
                <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
              )}

              {/* Price */}
              <div className="mt-4">
                <span className="text-3xl font-bold text-green-600">
                  ₹{product.price?.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-500 ml-2">per {product.unit}</span>
              </div>

              {/* Stock Status */}
              <div className="mt-4">
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-green-600 font-medium">
                      In Stock ({product.stock} {product.unit} available)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Quantity ({product.unit})</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 hover:bg-gray-100"
                      >
                        <FiMinus />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                        className="w-20 text-center py-3 border-x"
                        min="1"
                        max={product.stock}
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="p-3 hover:bg-gray-100"
                      >
                        <FiPlus />
                      </button>
                    </div>
                    <span className="text-gray-500">
                      Total: <span className="font-bold text-green-600">₹{(product.price * quantity).toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiShoppingCart />
                  {isInCart ? 'Add More to Cart' : 'Add to Cart'}
                </button>
                {isInCart && (
                  <Link to="/cart" className="block w-full btn-outline py-4 text-lg text-center">
                    View Cart
                  </Link>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-4">
                <div className="text-center">
                  <FiTruck className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-xs text-gray-600">Free Delivery</p>
                </div>
                <div className="text-center">
                  <FiShield className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-xs text-gray-600">Quality Guaranteed</p>
                </div>
                <div className="text-center">
                  <FiPackage className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-xs text-gray-600">Bulk Pricing</p>
                </div>
              </div>
            </div>

            {/* Contact for Bulk Orders */}
            <div className="bg-green-50 rounded-xl p-6 mt-4">
              <h3 className="font-semibold text-green-800 mb-2">Need Bulk Quantity?</h3>
              <p className="text-green-700 text-sm">
                Contact us for special pricing on large orders. We offer competitive rates for wholesale buyers.
              </p>
              <a href="tel:+919876543210" className="inline-block mt-3 text-green-600 font-semibold hover:underline">
                Call: +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
