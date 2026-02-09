/**
 * SmartStore Cart Store
 * Zustand state management for POS cart/checkout
 */

import { create } from "zustand";
import { saleRepository } from "../database";
import type { PaymentMethod, Product, Sale, SaleItemInput } from "../types";

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface CartState {
  // State
  items: CartItem[];
  discountAmount: number;
  discountPercent: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  notes: string;
  isProcessing: boolean;
  error: string | null;
  lastSale: Sale | null;

  // Computed (derived state)
  subtotal: () => number;
  totalDiscount: () => number;
  total: () => number;
  changeAmount: () => number;
  itemCount: () => number;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  incrementQuantity: (productId: number) => void;
  decrementQuantity: (productId: number) => void;
  setDiscountAmount: (amount: number) => void;
  setDiscountPercent: (percent: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountReceived: (amount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  checkout: () => Promise<Sale>;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  // Initial state
  items: [],
  discountAmount: 0,
  discountPercent: 0,
  paymentMethod: "cash",
  amountReceived: 0,
  notes: "",
  isProcessing: false,
  error: null,
  lastSale: null,

  // Computed: subtotal
  subtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  },

  // Computed: total discount
  totalDiscount: () => {
    const { discountAmount, discountPercent } = get();
    const subtotal = get().subtotal();
    return discountAmount + (subtotal * discountPercent) / 100;
  },

  // Computed: total
  total: () => {
    return get().subtotal() - get().totalDiscount();
  },

  // Computed: change amount
  changeAmount: () => {
    return Math.max(0, get().amountReceived - get().total());
  },

  // Computed: item count
  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Add item to cart
  addItem: (product: Product, quantity: number = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.product.id === product.id,
      );

      if (existingIndex >= 0) {
        // Update existing item quantity
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
        return { items: newItems };
      } else {
        // Add new item
        return {
          items: [
            ...state.items,
            { product, quantity, unitPrice: product.selling_price },
          ],
        };
      }
    });
  },

  // Remove item from cart
  removeItem: (productId: number) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  // Update item quantity
  updateQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    }));
  },

  // Increment quantity
  incrementQuantity: (productId: number) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    }));
  },

  // Decrement quantity
  decrementQuantity: (productId: number) => {
    const item = get().items.find((i) => i.product.id === productId);
    if (item && item.quantity <= 1) {
      get().removeItem(productId);
    } else {
      set((state) => ({
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      }));
    }
  },

  // Set discount amount
  setDiscountAmount: (amount: number) => {
    set({ discountAmount: Math.max(0, amount) });
  },

  // Set discount percent
  setDiscountPercent: (percent: number) => {
    set({ discountPercent: Math.min(100, Math.max(0, percent)) });
  },

  // Set payment method
  setPaymentMethod: (method: PaymentMethod) => {
    set({ paymentMethod: method });
  },

  // Set amount received
  setAmountReceived: (amount: number) => {
    set({ amountReceived: Math.max(0, amount) });
  },

  // Set notes
  setNotes: (notes: string) => {
    set({ notes });
  },

  // Clear cart
  clearCart: () => {
    set({
      items: [],
      discountAmount: 0,
      discountPercent: 0,
      paymentMethod: "cash",
      amountReceived: 0,
      notes: "",
      error: null,
    });
  },

  // Process checkout
  checkout: async () => {
    const state = get();

    if (state.items.length === 0) {
      throw new Error("Cart is empty");
    }

    if (state.amountReceived < state.total()) {
      throw new Error("Insufficient payment amount");
    }

    set({ isProcessing: true, error: null });

    try {
      const saleItems: SaleItemInput[] = state.items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }));

      const sale = await saleRepository.create({
        items: saleItems,
        discount_amount: state.discountAmount,
        discount_percent: state.discountPercent,
        payment_method: state.paymentMethod,
        amount_received: state.amountReceived,
        notes: state.notes || null,
      });

      // Clear cart and store last sale
      set({
        items: [],
        discountAmount: 0,
        discountPercent: 0,
        amountReceived: 0,
        notes: "",
        isProcessing: false,
        lastSale: sale,
      });

      return sale;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Checkout failed",
        isProcessing: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
