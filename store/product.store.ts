/**
 * SmartStore Product Store
 * Zustand state management for products
 */

import { create } from "zustand";
import { productRepository } from "../database";
import type {
    Product,
    ProductCategory,
    ProductInput,
    ProductWithRecipe,
} from "../types";

interface ProductState {
  // State
  products: Product[];
  productsWithMargins: ProductWithRecipe[];
  selectedProduct: ProductWithRecipe | null;
  isLoading: boolean;
  error: string | null;
  filterCategory: ProductCategory | null;

  // Actions
  fetchProducts: () => Promise<void>;
  fetchProductsWithMargins: () => Promise<void>;
  fetchByCategory: (category: ProductCategory) => Promise<void>;
  fetchForPOS: () => Promise<Product[]>;
  getProduct: (id: number) => Promise<ProductWithRecipe | null>;
  createProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (
    id: number,
    input: Partial<ProductInput>,
  ) => Promise<Product | null>;
  deleteProduct: (id: number) => Promise<boolean>;
  searchProducts: (query: string) => Promise<void>;
  setFilterCategory: (category: ProductCategory | null) => void;
  setSelectedProduct: (product: ProductWithRecipe | null) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  // Initial state
  products: [],
  productsWithMargins: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  filterCategory: null,

  // Fetch all products
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productRepository.getAll();
      set({ products, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
        isLoading: false,
      });
    }
  },

  // Fetch products with profit margins
  fetchProductsWithMargins: async () => {
    set({ isLoading: true, error: null });
    try {
      const productsWithMargins =
        await productRepository.getAllWithProfitMargins();
      set({ productsWithMargins, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
        isLoading: false,
      });
    }
  },

  // Fetch by category
  fetchByCategory: async (category: ProductCategory) => {
    set({ isLoading: true, error: null, filterCategory: category });
    try {
      const products = await productRepository.getByCategory(category);
      set({ products, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
        isLoading: false,
      });
    }
  },

  // Fetch for POS
  fetchForPOS: async () => {
    try {
      return await productRepository.getForPOS();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      });
      return [];
    }
  },

  // Get single product with recipe
  getProduct: async (id: number) => {
    try {
      const product = await productRepository.getWithRecipe(id);
      if (product) {
        set({ selectedProduct: product });
      }
      return product;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to get product",
      });
      return null;
    }
  },

  // Create new product
  createProduct: async (input: ProductInput) => {
    set({ isLoading: true, error: null });
    try {
      const newProduct = await productRepository.create(input);
      set((state) => ({
        products: [newProduct, ...state.products],
        isLoading: false,
      }));
      return newProduct;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create product",
        isLoading: false,
      });
      throw error;
    }
  },

  // Update product
  updateProduct: async (id: number, input: Partial<ProductInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await productRepository.update(id, input);
      if (updated) {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? updated : p)),
          isLoading: false,
        }));
      }
      return updated;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update product",
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete product (soft delete)
  deleteProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await productRepository.delete(id);
      if (success) {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          selectedProduct:
            state.selectedProduct?.id === id ? null : state.selectedProduct,
          isLoading: false,
        }));
      }
      return success;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete product",
        isLoading: false,
      });
      return false;
    }
  },

  // Search products
  searchProducts: async (query: string) => {
    set({ isLoading: true });
    try {
      if (query.trim() === "") {
        const products = await productRepository.getAll();
        set({ products, isLoading: false });
      } else {
        const products = await productRepository.search(query);
        set({ products, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Search failed",
        isLoading: false,
      });
    }
  },

  // Set filter category
  setFilterCategory: (category: ProductCategory | null) => {
    set({ filterCategory: category });
  },

  // Set selected product
  setSelectedProduct: (product: ProductWithRecipe | null) => {
    set({ selectedProduct: product });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
