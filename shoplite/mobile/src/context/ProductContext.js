import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  fetchProducts as fetchProductsAPI,
  fetchProductById as fetchProductByIdAPI,
} from '../services/api';

const ProductContext = createContext();

/**
 * ProductProvider - Manages product list and single product details state for mobile app
 */
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
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
      setProducts(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a single product by ID (with local fallback/instant display)
   */
  const getProductById = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // Immediately display cached item from existing product array for instantaneous UX
    const existing = products.find((item) => item._id === id);
    if (existing) {
      setCurrentProduct(existing);
    }

    try {
      const { data } = await fetchProductByIdAPI(id);
      if (data) {
        setCurrentProduct(data);
      }
    } catch (err) {
      console.warn('Error fetching individual product:', err.message);
      if (!existing) {
        setError(err.response?.data?.message || 'Failed to locate product details.');
      }
    } finally {
      setLoading(false);
    }
  }, [products]);

  /**
   * Clear currently viewed product on screen cleanup
   */
  const clearCurrentProduct = useCallback(() => {
    setCurrentProduct(null);
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        currentProduct,
        loading,
        error,
        getProducts,
        getProductById,
        clearCurrentProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

/**
 * Custom hook to use product context safely
 */
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
