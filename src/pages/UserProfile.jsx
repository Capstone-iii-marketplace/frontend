import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import SellerReviews from "../components/SellerReviews";
import { usersApi, chatApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCall } from "../context/CallContext.jsx";

// Two-letter avatar badge from a name, e.g. "Alice Bell" -> "AB".
function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// "Member since <month year>" text for the profile header.
function memberSince(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Public seller profile at /users/:id.
function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const call = useCall();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatError, setChatError] = useState(null);

  // Re-fetches the profile whenever the :id route param changes.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    usersApi
      .get(id)
      .then((data) => {
        if (!cancelled) setProfile(data.user);
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
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <main className="mx-auto max-w-5xl px-6 py-8">
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error || "User not found."}
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

  const isSelf = profile.id === user?.id;
  // Message / video call both need a conversation, and a conversation needs
  // a listing to anchor it to — same constraint the backend enforces on
  // "message seller" everywhere else, so a seller with no listings can't be
  // reached this way yet.
  const firstListing = profile.listings?.[0];

  async function openConversation() {
    const data = await chatApi.openConversation(firstListing.id);
    return data.conversation.id;
  }

  async function handleMessage() {
    try {
      const conversationId = await openConversation();
      navigate(`/messages/${conversationId}`);
    } catch (err) {
      setChatError(err.message);
    }
  }

  async function handleVideoCall() {
    try {
      const conversationId = await openConversation();
      navigate(`/messages/${conversationId}`);
      call.startCall(conversationId);
    } catch (err) {
      setChatError(err.message);
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

        <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
              {initials(profile.name)}
            </span>
          )}
          <div>
            <p className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
              {profile.name}
              {profile.verifiedAt && (
                <span className="text-emerald-600" title="Verified seller">
                  ✓
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              Member since {memberSince(profile.createdAt)}
            </p>
            {(profile.major || profile.semester) && (
              <p className="mt-1 text-sm text-gray-700">
                {[profile.major, profile.semester].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* No point messaging or calling yourself. */}
          {!isSelf && (
            <div className="ml-auto flex shrink-0 gap-2">
              <button
                type="button"
                onClick={handleMessage}
                disabled={!firstListing}
                title={
                  firstListing ? undefined : "No listings to message about yet"
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Message
              </button>
              <button
                type="button"
                onClick={handleVideoCall}
                disabled={!firstListing}
                title={
                  firstListing ? undefined : "No listings to call about yet"
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Video call
              </button>
            </div>
          )}
        </div>

        {chatError && <p className="mt-2 text-sm text-rose-600">{chatError}</p>}

        <SellerReviews sellerId={profile.id} />

        <h2 className="mt-8 text-sm font-semibold text-gray-900">Listings</h2>
        {!profile.listings || profile.listings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No listings yet.</p>
        ) : (
          <section className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {profile.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default UserProfile;
