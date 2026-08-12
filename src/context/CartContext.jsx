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

// Lets any component read the cart: const { items, addToCart } = useCart();
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}
