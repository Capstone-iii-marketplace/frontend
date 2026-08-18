import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ordersApi } from "../api/client";

// Converts integer cents into a display currency string.
function formatPrice(priceCents) {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  });
}

// Cart review page. "Place order" starts a Stripe Checkout session covering
// every item in the cart and redirects there; the cart itself is only
// cleared once the user lands back on /checkout/success.
function Checkout() {
  const { items, totalCents, removeFromCart, clearCart } = useCart();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState(null);

  async function handlePlaceOrder() {
    setError(null);
    setIsRedirecting(true);
    try {
      const { url } = await ordersApi.createCheckoutSession(
        items.map((item) => item.listingId),
      );
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setIsRedirecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to listings
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">
          Checkout
        </h1>

        {items.length === 0 ? (
          <p className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Your cart is empty.{" "}
            <Link to="/home" className="text-purple-700 hover:underline">
              Browse listings
            </Link>
          </p>
        ) : (
          <>
            <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {items.map((item) => (
                <li
                  key={item.listingId}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    {item.sellerName && (
                      <p className="text-xs text-gray-500">
                        Sold by {item.sellerName}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.priceCents)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.listingId)}
                    aria-label={`Remove ${item.title}`}
                    className="text-gray-400 hover:text-rose-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(totalCents)}
              </span>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-rose-50 p-3 text-center text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={isRedirecting}
              onClick={handlePlaceOrder}
              className="mt-4 w-full rounded-lg bg-purple-700 px-5 py-3 text-sm font-medium text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRedirecting ? "Redirecting to Stripe…" : "Place order"}
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Clear cart
            </button>
          </>
        )}
      </main>
    </div>
  );
}

export default Checkout;
