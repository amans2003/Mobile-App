import { useNavigate } from 'react-router-dom';

/**
 * ProductTable - Displays products in a responsive table
 * Includes image, name, price, category, stock, and action buttons
 */
const ProductTable = ({ products, onDelete }) => {
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-gray-400 text-lg">No products found</p>
        <p className="text-gray-300 text-sm mt-1">Add your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full" id="product-table">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product) => (
            <tr
              key={product._id}
              className="hover:bg-blue-50/30 transition-colors duration-150"
            >
              {/* Product Image */}
              <td className="px-6 py-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                  {product.image ? (
                    <img
                      src={product.image.startsWith('http') ? product.image : `https://mobile-app-999f.onrender.com${product.image}`}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </td>

              {/* Product Name */}
              <td className="px-6 py-4">
                <p className="font-medium text-gray-800 text-sm">{product.title}</p>
              </td>

              {/* Price */}
              <td className="px-6 py-4">
                <span className="text-sm font-semibold text-emerald-600">
                  ${product.price?.toFixed(2)}
                </span>
              </td>

              {/* Category */}
              <td className="px-6 py-4">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {product.category}
                </span>
              </td>

              {/* Stock */}
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    product.stock > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </td>

              {/* Actions */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/products/edit/${product._id}`)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors duration-150 cursor-pointer"
                    title="Edit product"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(product._id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors duration-150 cursor-pointer"
                    title="Delete product"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
