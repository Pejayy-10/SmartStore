/**
 * SmartStore Ingredient Store
 * Zustand state management for ingredients
 * Following PROJECT_RULES.md: Use Zustand, no prop drilling beyond 2 levels
 */

import { create } from "zustand";
import { ingredientRepository } from "../database";
import type { Ingredient, IngredientInput } from "../types";

interface IngredientState {
  // State
  ingredients: Ingredient[];
  lowStockIngredients: Ingredient[];
  selectedIngredient: Ingredient | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  fetchIngredients: () => Promise<void>;
  fetchLowStock: () => Promise<void>;
  searchIngredients: (query: string) => Promise<void>;
  getIngredient: (id: number) => Promise<Ingredient | null>;
  createIngredient: (input: IngredientInput) => Promise<Ingredient>;
  updateIngredient: (
    id: number,
    input: Partial<IngredientInput>,
  ) => Promise<Ingredient | null>;
  deleteIngredient: (id: number) => Promise<boolean>;
  updateStock: (id: number, quantityChange: number) => Promise<boolean>;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  clearError: () => void;
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  // Initial state
  ingredients: [],
  lowStockIngredients: [],
  selectedIngredient: null,
  isLoading: false,
  error: null,
  searchQuery: "",

  // Fetch all ingredients
  fetchIngredients: async () => {
    set({ isLoading: true, error: null });
    try {
      const ingredients = await ingredientRepository.getAll();
      set({ ingredients, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch ingredients",
        isLoading: false,
      });
    }
  },

  // Fetch low stock ingredients
  fetchLowStock: async () => {
    try {
      const lowStockIngredients = await ingredientRepository.getLowStock();
      set({ lowStockIngredients });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch low stock items",
      });
    }
  },

  // Search ingredients
  searchIngredients: async (query: string) => {
    set({ searchQuery: query, isLoading: true });
    try {
      if (query.trim() === "") {
        const ingredients = await ingredientRepository.getAll();
        set({ ingredients, isLoading: false });
      } else {
        const ingredients = await ingredientRepository.search(query);
        set({ ingredients, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Search failed",
        isLoading: false,
      });
    }
  },

  // Get single ingredient
  getIngredient: async (id: number) => {
    try {
      const ingredient = await ingredientRepository.getById(id);
      if (ingredient) {
        set({ selectedIngredient: ingredient });
      }
      return ingredient;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to get ingredient",
      });
      return null;
    }
  },

  // Create new ingredient
  createIngredient: async (input: IngredientInput) => {
    set({ isLoading: true, error: null });
    try {
      const newIngredient = await ingredientRepository.create(input);
      set((state) => ({
        ingredients: [newIngredient, ...state.ingredients],
        isLoading: false,
      }));
      return newIngredient;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create ingredient",
        isLoading: false,
      });
      throw error;
    }
  },

  // Update ingredient
  updateIngredient: async (id: number, input: Partial<IngredientInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await ingredientRepository.update(id, input);
      if (updated) {
        set((state) => ({
          ingredients: state.ingredients.map((i) =>
            i.id === id ? updated : i,
          ),
          selectedIngredient:
            state.selectedIngredient?.id === id
              ? updated
              : state.selectedIngredient,
          isLoading: false,
        }));
      }
      return updated;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update ingredient",
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete ingredient (soft delete)
  deleteIngredient: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await ingredientRepository.delete(id);
      if (success) {
        set((state) => ({
          ingredients: state.ingredients.filter((i) => i.id !== id),
          selectedIngredient:
            state.selectedIngredient?.id === id
              ? null
              : state.selectedIngredient,
          isLoading: false,
        }));
      }
      return success;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete ingredient",
        isLoading: false,
      });
      return false;
    }
  },

  // Update stock quantity
  updateStock: async (id: number, quantityChange: number) => {
    try {
      const success = await ingredientRepository.updateStock(
        id,
        quantityChange,
      );
      if (success) {
        // Refresh the ingredient to get updated quantity
        const updated = await ingredientRepository.getById(id);
        if (updated) {
          set((state) => ({
            ingredients: state.ingredients.map((i) =>
              i.id === id ? updated : i,
            ),
          }));
        }
        // Refresh low stock list
        get().fetchLowStock();
      }
      return success;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update stock",
      });
      return false;
    }
  },

  // Set selected ingredient
  setSelectedIngredient: (ingredient: Ingredient | null) => {
    set({ selectedIngredient: ingredient });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
