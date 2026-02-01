import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiTruck, FiShield, FiClock, FiPercent, FiArrowRight } from 'react-icons/fi';
import { productAPI } from '../api';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productAPI.getAll({ limit: 8 });
      setFeaturedProducts(res.data.data.products || res.data.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Fresh Fruits', icon: '🍎', link: '/products?category=FRUITS', color: 'bg-red-100' },
    { name: 'Exotic Fruits', icon: '🥝', link: '/products?category=EXOTIC', color: 'bg-green-100' },
    { name: 'Seasonal', icon: '🥭', link: '/products?category=SEASONAL', color: 'bg-yellow-100' },
    { name: 'Dry Fruits', icon: '🥜', link: '/products?category=DRY_FRUITS', color: 'bg-orange-100' },
  ];

  const features = [
    { icon: FiTruck, title: 'Fast Delivery', desc: 'Same day delivery in Mumbai' },
    { icon: FiShield, title: 'Quality Assured', desc: '100% fresh & premium quality' },
    { icon: FiClock, title: '24/7 Support', desc: 'Always here to help you' },
    { icon: FiPercent, title: 'Best Prices', desc: 'Wholesale rates guaranteed' },
  ];

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full text-sm mb-4">
                🎉 B2B Wholesale Platform
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Fresh Fruits at <span className="text-orange-300">Wholesale Prices</span>
              </h1>
              <p className="text-lg text-green-100 mb-8">
                Rajpur's trusted wholesale fruit supplier. Get premium quality fruits delivered to your business at unbeatable prices.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="btn-secondary flex items-center gap-2 text-lg px-6 py-3">
                  Shop Now <FiArrowRight />
                </Link>
                <Link to="/register" className="btn-outline border-white text-white hover:bg-white hover:text-green-700 px-6 py-3">
                  Register as Buyer
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-white/10 rounded-full absolute -top-4 -left-4"></div>
                <div className="text-[200px] relative z-10">🍎</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Features */}
      <section className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4">
                <feature.icon className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, index) => (
              <Link
                key={index}
                to={cat.link}
                className={`${cat.color} rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <span className="text-5xl block mb-3">{cat.icon}</span>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products" className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-1">
              View All <FiArrowRight />
            </Link>
          </div>
          
          {loading ? (
            <Loading text="Loading products..." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Ordering?</h2>
          <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of retailers who trust Ganesh Fruit Suppliers for their daily fruit needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors">
              Create Account
            </Link>
            <Link to="/products" className="border-2 border-white hover:bg-white hover:text-orange-600 font-semibold px-8 py-3 rounded-lg transition-colors">
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-green-600">500+</p>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-600">50+</p>
              <p className="text-gray-600">Fruit Varieties</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-600">10+</p>
              <p className="text-gray-600">Years Experience</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-600">24/7</p>
              <p className="text-gray-600">Customer Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
