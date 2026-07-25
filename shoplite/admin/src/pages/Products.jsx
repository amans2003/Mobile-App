import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductTable from '../components/ProductTable';
import Loader from '../components/Loader';
import { useProducts } from '../context/ProductContext';

/**
 * Products Page - List all products with CRUD actions
 * Includes Add Product button, product table, and delete functionality
 */
const Products = () => {
  const { products, loading, error, getProducts, removeProduct } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  /**
   * Handle product deletion with confirmation
   */
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await removeProduct(id);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div>
      <Navbar title="Products" />

      <div className="p-8">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">All Products</h3>
            <p className="text-sm text-gray-400 mt-1">{products.length} products total</p>
          </div>
          <button
            onClick={() => navigate('/products/add')}
            id="btn-add-product"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Product Table or Loader */}
        {loading ? (
          <Loader />
        ) : (
          <ProductTable products={products} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
};

export default Products;
