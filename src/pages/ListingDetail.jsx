import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { marketplaceApi, chatApi, ordersApi } from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCall } from "../context/CallContext.jsx";

const STATUS_STYLES = {
  avaliable: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  sold: "bg-gray-100 text-gray-500",
  removed: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL = {
  available: "Available",
  pending: "Pending",
  sold: "Sold",
  removed: "Removed",
};

const PAYMENT_LABEL = {
  online: "Online payment only",
  in_person: "In-person only",
  both: "Online or in-person",
};

const KIND_LABEL = {
  item: "Item",
  session: "Tutoring",
  post: "Guide",
};

const KIND_STYLES = {
  item: "bg-gray-100 text-gray-600",
  session: "bg-indigo-50 text-indigo-700",
  post: "bg-sky-50 text-sky-700",
};

// Converts integer cents into a display currency string.
function formatPrice(priceCents) {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  });
}

// Turns a timestamp into relative text like "3h ago".
function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Absolute date for the "Posted <timeAgo> · <formatDate>" line.
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "Member since <month year>" text for the seller card.
function memberSince(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Two-letter avatar badge from a seller's name.
function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// Small inline SVG icon — no external icon library is used in this project.
function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

// Single-listing detail page at /listings/:id.
function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();

  const { user } = useAuth();
  const call = useCall();
  const [chatError, setChatError] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Local-only "wishlist" heart toggle — not persisted to the backend.
  const [saved, setSaved] = useState(false);

  // Re-fetches the listing whenever the :id route param changes.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    marketplaceApi
      .listing(id)
      .then((data) => {
        if (!cancelled) setListing(data.listing);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <main className="mx-auto max-w-5xl px-6 py-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
            <div className="space-y-3">
              <div className="h-8 w-1/3 animate-pulse rounded bg-gray-100" />
              <div className="h-6 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <main className="mx-auto max-w-5xl px-6 py-8">
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error || "Listing not found."}
          </p>
          <Link
            to="/home"
            className="mt-4 inline-block text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to listings
          </Link>
        </main>
      </div>
    );
  }

  const image = listing.images?.[0];
  const statusClass = STATUS_STYLES[listing.status] || STATUS_STYLES.avaliable;
  const statusLabel = STATUS_LABEL[listing.status] || listing.status;
  const inCart = isInCart(listing.id);

  function handleAddToCart() {
    addToCart(listing);
  }

  // "Buy now" shortcut — adds to cart and jumps straight to checkout in one step.
  function handleCheckout() {
    addToCart(listing);
    navigate("/checkout");
  }

  // Opening a chat is idempotent server-side — clicking twice lands in the
  // same thread rather than creating a second one.
  async function handleMessageSeller() {
    try {
      const data = await chatApi.openConversation(listing.id);
      navigate(`/messages/${data.conversation.id}`);
    } catch (err) {
      setChatError(err.message);
    }
  }

  // "Request a call" on a free post — same open-or-find-conversation step
  // as messaging, then starts the call immediately.
  async function handleRequestCall() {
    try {
      const data = await chatApi.openConversation(listing.id);
      navigate(`/messages/${data.conversation.id}`);
      call.startCall(data.conversation.id);
    } catch (err) {
      setChatError(err.message);
    }
  }

  // Skips the cart entirely — a session is a single-item purchase, same
  // Stripe Checkout session the cart flow uses under the hood.
  async function handleBookSession() {
    setChatError(null);
    setIsBooking(true);
    try {
      const { url } = await ordersApi.createCheckoutSession([listing.id]);
      window.location.href = url;
    } catch (err) {
      setChatError(err.message);
      setIsBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to listings
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
            {image ? (
              <img
                src={image}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                No photo
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {listing.kind === "post"
                  ? "Free"
                  : formatPrice(listing.priceCents) +
                    (listing.kind === "session" ? "/hr" : "")}
              </span>
              <button
                type="button"
                onClick={() => setSaved((s) => !s)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  saved
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:text-rose-600"
                }`}
              >
                <span>{saved ? "♥" : "♡"}</span>
                {saved ? "Saved" : "Save"}
              </button>
            </div>

            <h1 className="mt-2 text-xl font-bold text-gray-900">
              {listing.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  KIND_STYLES[listing.kind] || KIND_STYLES.item
                }`}
              >
                {KIND_LABEL[listing.kind] || "Item"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}
              >
                {statusLabel}
              </span>
              {listing.kind !== "post" && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {PAYMENT_LABEL[listing.paymentMethods]}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Posted {timeAgo(listing.createdAt)} ·{" "}
              {formatDate(listing.createdAt)}
            </p>

            <h2 className="mt-6 text-sm font-semibold text-gray-900">
              Description
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {listing.description || listing.title}
            </p>

            <div className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
              <Link
                to={`/users/${listing.seller?.id}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {initials(listing.seller?.name)}
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">
                    {listing.seller?.name}
                  </p>
                  <p className="flex items-center gap-1 text-emerald-600">
                    {listing.seller?.verifiedAt && (
                      <>
                        <span>✓</span> Verified CUNY student
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {listing.seller?.createdAt &&
                      `Member since ${memberSince(listing.seller.createdAt)}`}
                    {typeof listing.seller?.salesCount === "number" &&
                      ` · ${listing.seller.salesCount} sales`}
                  </p>
                </div>
              </Link>

              {/* No point messaging yourself — the API rejects it anyway. */}
              {listing.seller?.id !== user?.id && (
                <div className="ml-auto flex shrink-0 gap-2">
                  {listing.kind === "post" && (
                    <button
                      type="button"
                      onClick={handleRequestCall}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
                    >
                      Request a call
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleMessageSeller}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
                  >
                    {listing.kind === "post"
                      ? "Ask a question"
                      : listing.kind === "session"
                        ? "Message first"
                        : "Message"}
                  </button>
                </div>
              )}
            </div>

            {chatError && (
              <p className="mt-2 text-sm text-rose-600">{chatError}</p>
            )}

            {listing.kind === "item" && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={listing.status !== "available"}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition ${
                    inCart
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-900 hover:border-gray-900"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <CartIcon />
                  {inCart ? "In cart" : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={listing.status !== "available"}
                  className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Checkout
                </button>
              </div>
            )}

            {listing.kind === "session" && listing.seller?.id !== user?.id && (
              <button
                type="button"
                onClick={handleBookSession}
                disabled={listing.status !== "available" || isBooking}
                className="mt-6 w-full rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBooking
                  ? "Redirecting to Stripe…"
                  : `Book session (${formatPrice(listing.priceCents)})`}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ListingDetail;
