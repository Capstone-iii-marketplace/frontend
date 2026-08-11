import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './cart-context';

const STORAGE_KEY = 'tradenest_cart';

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((listing) => {
    setItems((prev) => {
      if (prev.some((item) => item.listingId === listing.id)) {
        return prev; // each listing is a one-off item — no quantities
      }
      return [
        ...prev,
        {
          listingId: listing.id,
          title: listing.title,
          priceCents: listing.priceCents,
          image: listing.images?.[0] ?? null,
          sellerName: listing.seller?.name ?? null,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((listingId) => {
    setItems((prev) => prev.filter((item) => item.listingId !== listingId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (listingId) => items.some((item) => item.listingId === listingId),
    [items],
  );

  const totalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.priceCents, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      totalCents,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
    }),
    [items, totalCents, addToCart, removeFromCart, clearCart, isInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
