import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";
import ListingCard from "../components/ListingCard";
import { useAuth } from "../context/AuthContext";
import { marketplaceApi } from "../api/client";

function Home() {
  const { user, isAuthenticated } = useAuth();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    marketplaceApi
      .listings()
      .then((data) => {
        if (!cancelled) setListings(data.listings || []);
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

  const filteredListings = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter((listing) =>
      listing.title.toLowerCase().includes(term),
    );
  }, [listings, search]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          {isAuthenticated
            ? `Welcome back, ${user?.name?.split(" ")[0] || "there"}`
            : "Find something you need"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what students are selling right now.
        </p>

        <div className="mt-6 flex gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search textbooks, furniture, electronics..."
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400"
          />
          {isAuthenticated ? (
            <Link
              to="/sell"
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Post an item
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Log in to sell
            </Link>
          )}
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Couldn't load listings: {error}
          </p>
        )}

        {isLoading ? (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-4">
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </section>
        ) : filteredListings.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-500">
            No listings found.
          </p>
        ) : (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Home;
