import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'beecraft-cart';

function loadInitialCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(item) {
    // item: { productId, productName, productSlug, image, variantId, variantName,
    //         optionValueIds, optionsSummary, quantity, unitPrice }
    setItems((prev) => {
      const match = prev.find(
        (current) =>
          current.productId === item.productId &&
          current.variantId === item.variantId &&
          JSON.stringify(current.optionValueIds ?? []) ===
            JSON.stringify(item.optionValueIds ?? []) &&
          current.customizationText === item.customizationText &&
          current.customizationTextColor === item.customizationTextColor &&
          JSON.stringify(current.customizationDetails ?? {}) === JSON.stringify(item.customizationDetails ?? {}) &&
          current.customizationFileName === item.customizationFileName,
      );

      if (match) {
        return prev.map((current) =>
          current.cartItemId === match.cartItemId
            ? { ...current, quantity: current.quantity + item.quantity }
            : current,
        );
      }

      return [...prev, { ...item, cartItemId: crypto.randomUUID() }];
    });
  }

  function removeItem(cartItemId) {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }

  function updateQuantity(cartItemId, quantity) {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity: safeQuantity } : i,
      ),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de um CartProvider');
  return ctx;
}
