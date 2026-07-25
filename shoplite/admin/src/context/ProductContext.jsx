import { createContext, useContext, useState, useCallback } from 'react';
import {
  fetchProducts as fetchProductsAPI,
  createProduct as createProductAPI,
  updateProduct as updateProductAPI,
  deleteProduct as deleteProductAPI,
} from '../services/api';

const ProductContext = createContext();

/**
 * ProductProvider - Manages product state across admin panel
 */
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all products from the API
   */
  const getProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchProductsAPI();
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new product
   * @param {FormData} formData - Product data with image
   */
  const addProduct = async (formData) => {
    const { data } = await createProductAPI(formData);
    setProducts((prev) => [data, ...prev]);
    return data;
  };

  /**
   * Update an existing product
   * @param {string} id - Product ID
   * @param {FormData} formData - Updated product data
   */
  const editProduct = async (id, formData) => {
    const { data } = await updateProductAPI(id, formData);
    setProducts((prev) => prev.map((p) => (p._id === id ? data : p)));
    return data;
  };

  /**
   * Delete a product
   * @param {string} id - Product ID
   */
  const removeProduct = async (id) => {
    await deleteProductAPI(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        getProducts,
        addProduct,
        editProduct,
        removeProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

/**
 * Custom hook to use product context
 */
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
