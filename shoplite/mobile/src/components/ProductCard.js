import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * ProductCard - Display summary info for a product with safe number parsing and dark theme support
 */
const ProductCard = ({ product = {}, onPress }) => {
  const { theme, themeMode } = useTheme();

  // Safely parse image URL to avoid undefined startsWith errors
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const strPath = String(imagePath);
    return strPath.startsWith('http') ? strPath : `https://mobile-app-999f.onrender.com${strPath}`;
  };

  const imageUrl = getImageUrl(product.image);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: themeMode === 'dark' ? 1 : 0,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
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
          <Ionicons name="image-outline" size={32} color={theme.textMuted} />
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="pricetag-outline" size={10} color={theme.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.category, { color: theme.primary }]}>{product.category || 'General'}</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {product.title || 'Untitled Product'}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.primary }]}>
            ${Number(product.price || 0).toFixed(2)}
          </Text>
          {Number(product.stock || 0) <= 0 && (
            <Text style={styles.outOfStock}>Out of stock</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
  },
  outOfStock: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
});

export default ProductCard;
