import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { useTheme } from '../context/ThemeContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

/**
 * ProductDetailScreen - Comprehensive view of a single product with type-safe formatting
 */
const ProductDetailScreen = ({ route }) => {
  const { productId } = route?.params || {};
  const { currentProduct, loading, error, getProductById, clearCurrentProduct } = useProducts();
  const { theme, themeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const fetchProduct = useCallback(() => {
    if (productId) {
      getProductById(productId);
    }
  }, [productId, getProductById]);

  useEffect(() => {
    fetchProduct();
    return () => clearCurrentProduct();
  }, [fetchProduct, clearCurrentProduct]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (productId) {
      await getProductById(productId);
    }
    setRefreshing(false);
  };

  if (loading && !currentProduct) {
    return <Loader />;
  }

  if (error || (!loading && !currentProduct)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <EmptyState
          title="Product Not Found"
          message={error || 'We could not locate this product details.'}
        />
      </SafeAreaView>
    );
  }

  // Safely format URL and numeric properties
  const imageUrl = currentProduct?.image
    ? String(currentProduct.image).startsWith('http')
      ? currentProduct.image
      : `http://localhost:5001${currentProduct.image}`
    : null;

  const numericPrice = Number(currentProduct?.price || 0).toFixed(2);
  const numericStock = Number(currentProduct?.stock || 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: themeMode === 'dark' ? '#334155' : '#F3F4F6' }]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={64} color={theme.textMuted} />
          )}
        </View>

        {/* Content Section */}
        <View style={[styles.content, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: themeMode === 'dark' ? 1 : 0 }]}>
          {/* Category & Stock Row */}
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="pricetag" size={12} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.categoryText, { color: theme.primary }]}>{currentProduct?.category || 'General'}</Text>
            </View>

            <View style={[
              styles.stockBadge,
              { backgroundColor: numericStock > 0 ? theme.successBg : theme.errorBg }
            ]}>
              <Ionicons
                name={numericStock > 0 ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={numericStock > 0 ? theme.successText : theme.errorText}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.stockText,
                  { color: numericStock > 0 ? theme.successText : theme.errorText },
                ]}
              >
                {numericStock > 0
                  ? `In Stock (${numericStock})`
                  : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Title and Price */}
          <Text style={[styles.title, { color: theme.text }]}>{currentProduct?.title || 'Untitled'}</Text>
          <Text style={[styles.price, { color: theme.primary }]}>
            ${numericPrice}
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Description Section */}
          <Text style={[styles.descriptionTitle, { color: theme.textSecondary }]}>Product Description</Text>
          <Text style={[styles.description, { color: theme.text }]}>
            {currentProduct?.description || 'No detailed description available for this item.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 400,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 32,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
});

export default ProductDetailScreen;
