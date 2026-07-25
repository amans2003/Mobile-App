import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

/**
 * HomeScreen - Main product listing screen with modern SafeAreaView and Theme Toggle
 */
const HomeScreen = ({ navigation }) => {
  const { products = [], loading, error, getProducts } = useProducts();
  const { theme, themeMode, toggleTheme } = useTheme();

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() =>
        navigation.navigate('ProductDetail', { productId: item?._id })
      }
    />
  );

  if (loading && (!products || products.length === 0)) {
    return <Loader />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Theme Toggle Button */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.brandName, { color: theme.text }]}>
            <Text style={styles.brandHighlight}>Shop</Text>Lite
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Discover amazing products</Text>
        </View>

        {/* Dark Mode Toggle Button */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: theme.primaryLight }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={themeMode === 'dark' ? 'sunny' : 'moon'}
            size={22}
            color={themeMode === 'dark' ? '#FBBF24' : '#3B82F6'}
          />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.errorBg }]}>
          <Text style={[styles.errorText, { color: theme.errorText }]}>{String(error)}</Text>
        </View>
      ) : null}

      {/* Product Grid */}
      {!products || products.length === 0 ? (
        <EmptyState
          title="No products available"
          message="Check back later for new products"
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item, idx) => item?._id || String(idx)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={getProducts}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
  },
  brandHighlight: {
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
});

export default HomeScreen;
