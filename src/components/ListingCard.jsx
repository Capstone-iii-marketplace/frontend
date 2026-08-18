import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const STATUS_STYLES = {
  available: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  sold: "bg-gray-100 text-gray-500",
  removed: "bg-gray-100 text-gray-500",
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

// Converts integer cents (how the backend stores money) into a display string.
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

// Turns a seller's name into a two-letter avatar badge, e.g. "Alice Bell" -> "AB".
function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// Reusable listing tile — used in the Home grid and the "Selling" tab of
// My Listings. The whole card is a Link to the listing's detail page.
function ListingCard({ listing }) {
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();
  const thumbnail = listing.images?.[0];
  const statusClass = STATUS_STYLES[listing.status] || STATUS_STYLES.available;
  const inCart = isInCart(listing.id);

  // stopPropagation is required here: without it, clicking the cart button
  // would also trigger the parent <Link>'s navigation to the detail page.
  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(listing);
  }

  // Same stopPropagation need as the cart button — this sits inside the
  // card's own <Link> to the listing detail page.
  function handleSellerClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (listing.seller?.id) navigate(`/users/${listing.seller.id}`);
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
        {listing.kind === "item" && (
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
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
            KIND_STYLES[listing.kind] || KIND_STYLES.item
          }`}
        >
          {KIND_LABEL[listing.kind] || "Item"}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-gray-900">
            {listing.kind === "post"
              ? "Free"
              : formatPrice(listing.priceCents) +
                (listing.kind === "session" ? "/hr" : "")}
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
          <button
            type="button"
            onClick={handleSellerClick}
            className="flex items-center gap-1.5 hover:underline"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
              {initials(listing.seller?.name)}
            </span>
            <span className="text-gray-700">{listing.seller?.name}</span>
            {listing.seller?.verifiedAt && (
              <span
                className="text-emerald-600"
                title="Verified CUNY student"
              >
                ✓
              </span>
            )}
          </button>
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default ListingCard;
