import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/Navbar";
import { marketplaceApi } from "../api/client";
import { useCart } from "../context/useCart";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  sold: "bg-gray-100 text-gray-500",
  removed: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL = {
  active: "Available",
  pending: "Pending",
  sold: "Sold",
  removed: "Removed",
};

const PAYMENT_LABEL = {
  online: "Online payment only",
  in_person: "In-person only",
  both: "Online or in-person",
};

function formatPrice(priceCents) {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  });
}

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

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function memberSince(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

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

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

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
        <NavBar />
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
        <NavBar />
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
  const statusClass = STATUS_STYLES[listing.status] || STATUS_STYLES.active;
  const statusLabel = STATUS_LABEL[listing.status] || listing.status;
  const inCart = isInCart(listing.id);

  function handleAddToCart() {
    addToCart(listing);
  }

  function handleCheckout() {
    addToCart(listing);
    navigate("/checkout");
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />

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
                {formatPrice(listing.priceCents)}
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
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}
              >
                {statusLabel}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {PAYMENT_LABEL[listing.paymentMethods]}
              </span>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Posted {timeAgo(listing.createdAt)} · {formatDate(listing.createdAt)}
            </p>

            <h2 className="mt-6 text-sm font-semibold text-gray-900">
              Description
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {listing.description || listing.title}
            </p>

            <div className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
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
                      <span>✓</span> Verified
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
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={listing.status !== "active"}
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
                disabled={listing.status !== "active"}
                className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Checkout
              </button>
            </div>

            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              Message Seller
            </button>

            {listing.paymentMethods !== "online" && (
              <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <p className="font-medium">🤝 Meet safely</p>
                <p className="mt-0.5 text-blue-700">
                  Choose a public location and meet during daytime hours when
                  possible.
                </p>
              </div>
            )}

            <button
              type="button"
              className="mt-4 text-xs text-gray-400 hover:text-gray-600"
            >
              Report listing
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ListingDetail;
