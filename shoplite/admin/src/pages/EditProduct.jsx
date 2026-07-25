import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { useProducts } from '../context/ProductContext';
import { fetchProductById } from '../services/api';

/**
 * EditProduct Page - Form to update an existing product
 * Pre-populates form with current product data
 */
const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { editProduct } = useProducts();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch product data on mount
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await fetchProductById(id);
        setTitle(data.title);
        setDescription(data.description);
        setPrice(data.price.toString());
        setCategory(data.category);
        setStock(data.stock.toString());
        if (data.image) {
          setCurrentImage(data.image);
        }
      } catch (err) {
        setError('Failed to load product');
      } finally {
        setFetching(false);
      }
    };

    loadProduct();
  }, [id]);

  /**
   * Handle image selection and preview
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !price || !category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('stock', stock || 0);
      if (image) {
        formData.append('image', image);
      }

      await editProduct(id, formData);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Loader />;

  return (
    <div>
      <Navbar title="Edit Product" />

      <div className="p-8">
        <div className="max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-4 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Products
            </button>
            <h3 className="text-xl font-bold text-gray-800">Edit Product</h3>
            <p className="text-sm text-gray-400 mt-1">Update the product details below</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Product Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-title">
                Product Title *
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                placeholder="Enter product title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-description">
                Description *
              </label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm resize-none"
                placeholder="Enter product description"
              />
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-price">
                  Price ($) *
                </label>
                <input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-stock">
                  Stock
                </label>
                <input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-category">
                Category *
              </label>
              <input
                id="edit-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
                placeholder="e.g. Electronics, Clothing, etc."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Image
              </label>

              {/* Current Image Preview */}
              {(imagePreview || currentImage) && (
                <div className="mb-3 flex items-center gap-4">
                  <img
                    src={imagePreview || (currentImage.startsWith('http') ? currentImage : `https://mobile-app-999f.onrender.com${currentImage}`)}
                    alt="Product"
                    className="w-24 h-24 object-cover rounded-xl shadow-sm border border-gray-100"
                  />
                  <p className="text-xs text-gray-400">
                    {imagePreview ? 'New image selected' : 'Current image'}
                  </p>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors duration-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  id="edit-image"
                />
                <p className="text-xs text-gray-400 mt-2">Upload a new image to replace the current one</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                id="btn-update-product"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Updating...' : 'Update Product'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
