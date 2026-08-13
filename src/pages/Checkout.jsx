import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";
import { useCart } from "../context/CartContext";

// Converts integer cents into a display currency string.
function formatPrice(priceCents) {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  });
}

// Cart review page. Payment is intentionally not wired up yet — the
// "Place order" button below is disabled on purpose (no backend endpoint
// for creating an order exists yet, only GET /api/orders/mine for history).
function Checkout() {
  const { items, totalCents, removeFromCart, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />

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

            <button
              type="button"
              disabled
              title="Payment isn't wired up yet"
              className="mt-4 w-full cursor-not-allowed rounded-lg bg-purple-700 px-5 py-3 text-sm font-medium text-white opacity-50"
            >
              Place order
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              Payment isn't connected yet — this is a placeholder for the
              real checkout flow.
            </p>

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
