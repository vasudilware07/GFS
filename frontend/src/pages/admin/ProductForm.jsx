import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiUpload, FiTrash2, FiImage, FiVideo, FiPlay } from 'react-icons/fi';
import { productAPI } from '../../api';
import { PageLoading, ButtonLoading } from '../../components/Loading';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

const categories = ['FRUITS', 'SEASONAL'];
const units = ['kg', 'dozen', 'piece', 'box', 'crate'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: 'FRUITS',
    price: '',
    unit: 'kg',
    stock: '',
    minStock: '10',
    sku: '',
    isActive: true,
  });

  // File upload states
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newVideoFiles, setNewVideoFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [videosToDelete, setVideosToDelete] = useState([]);

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      videoPreviews.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await productAPI.getById(id);
      const data = res.data.data;
      setProduct({
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'FRUITS',
        price: data.pricePerUnit || data.price || '',
        unit: data.unit || 'kg',
        stock: data.stock || '',
        minStock: data.minStock || data.lowStockThreshold || '10',
        sku: data.sku || '',
        isActive: data.isActive !== false && data.isAvailable !== false,
      });
      setExistingImages(data.images || []);
      setExistingVideos(data.videos || []);
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Image file handling
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length - imagesToDelete.length + newImageFiles.length + files.length;
    
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setNewImageFiles(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => [...prev, previewUrl]);
    });

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeExistingImage = (index) => {
    const imageUrl = existingImages[index];
    setImagesToDelete(prev => [...prev, imageUrl]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Video file handling
  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalVideos = existingVideos.length - videosToDelete.length + newVideoFiles.length + files.length;
    
    if (totalVideos > 3) {
      toast.error('Maximum 3 videos allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 100MB)`);
        return false;
      }
      return true;
    });

    setNewVideoFiles(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setVideoPreviews(prev => [...prev, { url: previewUrl, name: file.name }]);
    });

    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const removeExistingVideo = (index) => {
    const videoUrl = existingVideos[index]?.url || existingVideos[index];
    setVideosToDelete(prev => [...prev, videoUrl]);
    setExistingVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index) => {
    URL.revokeObjectURL(videoPreviews[index].url);
    setNewVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      
      // Add product data
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('category', product.category);
      formData.append('price', parseFloat(product.price));
      formData.append('unit', product.unit);
      formData.append('stock', parseInt(product.stock));
      formData.append('minStock', parseInt(product.minStock) || 10);
      formData.append('sku', product.sku);
      formData.append('isActive', product.isActive);

      // Add new image files
      newImageFiles.forEach(file => {
        formData.append('images', file);
      });

      // Add new video files
      newVideoFiles.forEach(file => {
        formData.append('videos', file);
      });

      // For edit mode, include existing media to keep and media to delete
      if (isEdit) {
        formData.append('existingImages', JSON.stringify(existingImages));
        formData.append('existingVideos', JSON.stringify(existingVideos));
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
        formData.append('videosToDelete', JSON.stringify(videosToDelete));
      }

      if (isEdit) {
        await productAPI.update(id, formData);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(formData);
        toast.success('Product created successfully');
      }
      navigate('/admin/products');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getVideoUrl = (video) => {
    const url = video?.url || video;
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) return <PageLoading />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <FiX className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                name="name"
                required
                value={product.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Fresh Alphonso Mangoes"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows="3"
                value={product.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe the product quality, origin, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                required
                value={product.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                name="sku"
                value={product.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., FRT-MNG-001"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                value={product.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                name="unit"
                required
                value={product.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                name="stock"
                required
                min="0"
                value={product.stock}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label>
              <input
                type="number"
                name="minStock"
                min="0"
                value={product.minStock}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiImage className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
            <span className="text-sm text-gray-500">(Max 5 images, 5MB each)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
            {/* Existing Images */}
            {existingImages.map((img, index) => (
              <div key={`existing-${index}`} className="relative group aspect-square">
                <img
                  src={getImageUrl(img)}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                  Saved
                </span>
              </div>
            ))}

            {/* New Image Previews */}
            {imagePreviews.map((previewUrl, index) => (
              <div key={`new-${index}`} className="relative group aspect-square">
                <img
                  src={previewUrl}
                  alt={`New ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-green-400"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                  New
                </span>
              </div>
            ))}

            {/* Add Image Button */}
            {(existingImages.length + newImageFiles.length) < 5 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors"
              >
                <FiUpload className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Add Image</span>
              </button>
            )}
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          <p className="text-sm text-gray-500">
            Upload high-quality images of your product. Supported formats: JPG, PNG, WebP
          </p>
        </div>

        {/* Product Videos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiVideo className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Product Videos</h2>
            <span className="text-sm text-gray-500">(Max 3 videos, 100MB each)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Existing Videos */}
            {existingVideos.map((video, index) => (
              <div key={`existing-video-${index}`} className="relative group">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    src={getVideoUrl(video)}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingVideo(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded z-10">
                  Saved
                </span>
              </div>
            ))}

            {/* New Video Previews */}
            {videoPreviews.map((preview, index) => (
              <div key={`new-video-${index}`} className="relative group">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-400">
                  <video
                    src={preview.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeNewVideo(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 right-10 z-10">
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                    New
                  </span>
                  <p className="text-xs text-white mt-1 truncate bg-black/50 px-1 rounded">
                    {preview.name}
                  </p>
                </div>
              </div>
            ))}

            {/* Add Video Button */}
            {(existingVideos.length + newVideoFiles.length) < 3 && (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <FiVideo className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">Add Video</span>
                <span className="text-xs text-gray-400 mt-1">Show product quality</span>
              </button>
            )}
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoSelect}
            className="hidden"
          />

          <p className="text-sm text-gray-500">
            Upload videos showcasing product quality and freshness. Supported formats: MP4, WebM, MOV
          </p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={product.isActive}
              onChange={handleChange}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-gray-900">Active</span>
              <p className="text-sm text-gray-500">Product will be visible to customers</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <ButtonLoading />
            ) : (
              <>
                <FiSave className="w-5 h-5" />
                {isEdit ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
