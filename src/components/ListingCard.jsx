import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const STATUS_STYLES = {
  avaliable: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  sold: "bg-gray-100 text-gray-500",
  removed: "bg-gray-100 text-gray-500",
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

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function ListingCard({ listing }) {
  const { addToCart, isInCart } = useCart();
  const thumbnail = listing.images?.[0];
  const statusClass = STATUS_STYLES[listing.status] || STATUS_STYLES.avaliable;
  const inCart = isInCart(listing.id);

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(listing);
  }

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No photo
          </div>
        )}
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={inCart ? "Already in cart" : "Add to cart"}
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold shadow-sm transition ${
            inCart
              ? "bg-gray-900 text-white"
              : "bg-white/90 text-gray-500 hover:bg-gray-900 hover:text-white"
          }`}
        >
          {inCart ? "✓" : "+"}
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(listing.priceCents)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass}`}
          >
            {listing.status}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-gray-700">
          {listing.title}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
              {initials(listing.seller?.name)}
            </span>
            <span className="text-gray-700">{listing.seller?.name}</span>
            {listing.seller?.verifiedAt && (
              <span className="text-emerald-600" title="Verified seller">
                ✓
              </span>
            )}
          </div>
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default ListingCard;
