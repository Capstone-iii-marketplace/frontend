import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Landing page for Stripe's success_url. The webhook (not this page) is
// what actually marks the order paid — this just clears the local cart now
// that the items it referenced have been bought.
function CheckoutSuccess() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // Runs once on mount — clearCart's identity is stable but including it
    // would still be safe, this just makes the "once" intent explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Payment successful
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Thanks for your order — you can find it under your order history.
        </p>
        <Link
          to="/home"
          className="mt-6 inline-block rounded-lg bg-purple-700 px-5 py-3 text-sm font-medium text-white hover:bg-purple-800"
        >
          Back to listings
        </Link>
      </main>
    </div>
  );
}

export default CheckoutSuccess;
