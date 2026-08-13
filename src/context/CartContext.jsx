import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'tradenest_cart';

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Holds the shopping cart, so any component can read/change it with
// useCart() instead of passing items/addToCart down as props.
export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Adds a listing to the cart, deduped by id — each listing is a one-off
  // physical item, so it can't be added twice. Stores a lightweight
  // snapshot rather than the full listing object.
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

  // Drops one item from the cart by listing id.
  const removeFromCart = useCallback((listingId) => {
    setItems((prev) => prev.filter((item) => item.listingId !== listingId));
  }, []);

  // Empties the cart entirely (used after "Clear cart").
  const clearCart = useCallback(() => setItems([]), []);

  // Used by ListingCard/ListingDetail to show "Add to cart" vs "In cart".
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

// Hook every component uses to read/change the cart:
// const { items, count, totalCents, addToCart, removeFromCart } = useCart();
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}
