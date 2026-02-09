/**
 * SmartStore Recipe Store
 * Zustand state management for recipes
 */

import { create } from "zustand";
import { recipeRepository } from "../database";
import type { Recipe, RecipeInput, RecipeWithItems } from "../types";

interface RecipeState {
  // State
  recipes: Recipe[];
  selectedRecipe: RecipeWithItems | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRecipes: () => Promise<void>;
  getRecipe: (id: number) => Promise<RecipeWithItems | null>;
  createRecipe: (input: RecipeInput) => Promise<Recipe>;
  updateRecipe: (
    id: number,
    input: Partial<RecipeInput>,
  ) => Promise<Recipe | null>;
  deleteRecipe: (id: number) => Promise<boolean>;
  searchRecipes: (query: string) => Promise<void>;
  recalculateCost: (id: number) => Promise<Recipe | null>;
  setSelectedRecipe: (recipe: RecipeWithItems | null) => void;
  clearError: () => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  // Initial state
  recipes: [],
  selectedRecipe: null,
  isLoading: false,
  error: null,

  // Fetch all recipes
  fetchRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const recipes = await recipeRepository.getAll();
      set({ recipes, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch recipes",
        isLoading: false,
      });
    }
  },

  // Get recipe with items
  getRecipe: async (id: number) => {
    try {
      const recipe = await recipeRepository.getWithItems(id);
      if (recipe) {
        set({ selectedRecipe: recipe });
      }
      return recipe;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to get recipe",
      });
      return null;
    }
  },

  // Create new recipe
  createRecipe: async (input: RecipeInput) => {
    set({ isLoading: true, error: null });
    try {
      const newRecipe = await recipeRepository.create(input);
      set((state) => ({
        recipes: [newRecipe, ...state.recipes],
        isLoading: false,
      }));
      return newRecipe;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create recipe",
        isLoading: false,
      });
      throw error;
    }
  },

  // Update recipe
  updateRecipe: async (id: number, input: Partial<RecipeInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await recipeRepository.update(id, input);
      if (updated) {
        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === id ? updated : r)),
          isLoading: false,
        }));
      }
      return updated;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update recipe",
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete recipe (soft delete)
  deleteRecipe: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await recipeRepository.delete(id);
      if (success) {
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
          selectedRecipe:
            state.selectedRecipe?.id === id ? null : state.selectedRecipe,
          isLoading: false,
        }));
      }
      return success;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete recipe",
        isLoading: false,
      });
      return false;
    }
  },

  // Search recipes
  searchRecipes: async (query: string) => {
    set({ isLoading: true });
    try {
      if (query.trim() === "") {
        const recipes = await recipeRepository.getAll();
        set({ recipes, isLoading: false });
      } else {
        const recipes = await recipeRepository.search(query);
        set({ recipes, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Search failed",
        isLoading: false,
      });
    }
  },

  // Recalculate recipe cost
  recalculateCost: async (id: number) => {
    try {
      const updated = await recipeRepository.recalculateCost(id);
      if (updated) {
        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === id ? updated : r)),
        }));
      }
      return updated;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to recalculate cost",
      });
      return null;
    }
  },

  // Set selected recipe
  setSelectedRecipe: (recipe: RecipeWithItems | null) => {
    set({ selectedRecipe: recipe });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
