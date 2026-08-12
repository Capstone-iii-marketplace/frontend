import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";
import ListingCard from "../components/ListingCard";
import { marketplaceApi, ordersApi } from "../api/client";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatPrice(priceCents) {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  });
}

function OrderRow({ order }) {
  const listing = order.listing;
  const thumbnail = listing?.images?.[0];

  return (
    <li className="flex items-center gap-4 p-4">
      <Link
        to={listing ? `/listings/${listing.id}` : "#"}
        className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </Link>
      <div className="flex-1">
        <Link
          to={listing ? `/listings/${listing.id}` : "#"}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          {listing?.title || "Listing no longer available"}
        </Link>
        {listing?.seller?.name && (
          <p className="text-xs text-gray-500">Sold by {listing.seller.name}</p>
        )}
      </div>
      <span className="text-sm font-semibold text-gray-900">
        {formatPrice(order.amountCents)}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          STATUS_STYLES[order.status] || STATUS_STYLES.pending
        }`}
      >
        {order.status}
      </span>
    </li>
  );
}

function MyListings() {
  const [tab, setTab] = useState("selling");
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([marketplaceApi.myListings(), ordersApi.mine()])
      .then(([listingsData, ordersData]) => {
        if (cancelled) return;
        setListings(listingsData.listings || []);
        setOrders(ordersData.orders || []);
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
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          My Listings
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Everything you're selling and everything you've bought.
        </p>

        <div className="mt-6 flex gap-1 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("selling")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "selling"
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Selling ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("bought")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "bought"
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bought ({orders.length})
          </button>
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Couldn't load your listings: {error}
          </p>
        )}

        {isLoading ? (
          <p className="mt-10 text-center text-sm text-gray-500">Loading...</p>
        ) : tab === "selling" ? (
          listings.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">
              You haven't posted anything yet.{" "}
              <Link to="/sell" className="text-purple-700 hover:underline">
                Post an item
              </Link>
            </p>
          ) : (
            <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </section>
          )
        ) : orders.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-500">
            You haven't bought anything yet.{" "}
            <Link to="/home" className="text-purple-700 hover:underline">
              Browse listings
            </Link>
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default MyListings;
