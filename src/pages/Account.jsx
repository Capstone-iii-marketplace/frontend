import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import { useAuth } from "../context/AuthContext";
import { useCall } from "../context/CallContext.jsx";
import { ordersApi, marketplaceApi, chatApi, authApi } from "../api/client";

// Downscales and re-encodes the picked file in the browser so the resulting
// data URL stays a reasonable size — same approach PostListing.jsx uses for
// listing photos, just smaller since this only ever renders as a small
// circular avatar.
function fileToDataUrl(file, maxDimension = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a valid image"));
      img.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width, img.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "purchases", label: "Purchases" },
  { value: "sessions", label: "My sessions" },
  { value: "listings", label: "My listings" },
  { value: "settings", label: "Settings" },
];

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

function memberSince(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// A booked-or-to-deliver session row, shared by both halves of the
// "My sessions" tab — only the button behavior differs between them.
function SessionRow({ order, otherName, onJoin, joinDisabledReason }) {
  const listing = order.listing;
  return (
    <li className="flex items-center gap-4 p-4">
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {listing?.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex-1">
        <Link
          to={listing ? `/listings/${listing.id}` : "#"}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          {listing?.title || "Listing no longer available"}
        </Link>
        <p className="text-xs text-gray-500">with {otherName}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          STATUS_STYLES[order.status] || STATUS_STYLES.pending
        }`}
      >
        {order.status}
      </span>
      <button
        type="button"
        onClick={onJoin}
        disabled={Boolean(joinDisabledReason)}
        title={joinDisabledReason}
        className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Join session
      </button>
    </li>
  );
}

// Authenticated user's own account: purchases, upcoming sessions (both as
// the person who booked and the person delivering), listings, and basic
// account info. Distinct from the public profile at /users/:id.
function Account() {
  const { user, setUser } = useAuth();
  const call = useCall();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinError, setJoinError] = useState(null);

  const [profileForm, setProfileForm] = useState({
    major: "",
    semester: "",
    avatarUrl: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const avatarFileInputRef = useRef(null);

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !file.type.startsWith("image/")) return;

    setIsProcessingAvatar(true);
    setProfileSaveError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      setProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
    } catch (err) {
      setProfileSaveError(err.message || "Couldn't process that photo.");
    } finally {
      setIsProcessingAvatar(false);
    }
  }

  // user loads asynchronously (an initial /me call), so this can't be the
  // useState initializer above — it has to re-sync once user actually
  // arrives, or the form stays frozen on empty strings forever.
  useEffect(() => {
    if (user) {
      setProfileForm({
        major: user.major || "",
        semester: user.semester || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaveError("");
    try {
      const data = await authApi.updateMe(profileForm);
      setUser(data.user);
    } catch (err) {
      setProfileSaveError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      // Needs both sides — Purchases reads the buyer orders, "sessions
      // you're delivering" reads the seller orders.
      ordersApi.mine({ includeSelling: true }),
      marketplaceApi.myListings(),
      chatApi.conversations(),
    ])
      .then(([orderData, listingData, convData]) => {
        if (cancelled) return;
        setOrders(orderData.orders || []);
        setListings(
          (listingData.listings || []).filter((l) => l.status !== "removed"),
        );
        setConversations(convData.conversations || []);
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

  const purchases = orders.filter((o) => o.buyerId === user?.id);
  const sessionsBooked = purchases.filter((o) => o.listing?.kind === "session");
  const sessionsToDeliver = orders.filter(
    (o) => o.listing?.kind === "session" && o.listing?.sellerId === user?.id,
  );

  // The buyer can always (re)open a conversation for a listing they bought —
  // same rule "message seller" uses everywhere else.
  async function handleJoinAsBuyer(order) {
    setJoinError(null);
    try {
      const data = await chatApi.openConversation(order.listing.id);
      navigate(`/messages/${data.conversation.id}`);
      call.startCall(data.conversation.id);
    } catch (err) {
      setJoinError(err.message);
    }
  }

  // The seller can't open a fresh conversation on their own listing (the
  // backend rejects that), so delivering a session depends on one already
  // existing with that specific buyer.
  function findConversationFor(order) {
    return conversations.find(
      (c) => c.listingId === order.listingId && c.buyerId === order.buyerId,
    );
  }

  function handleJoinAsSeller(order) {
    setJoinError(null);
    const conversation = findConversationFor(order);
    if (!conversation) return;
    navigate(`/messages/${conversation.id}`);
    call.startCall(conversation.id);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          My account
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Everything about your own account — for how you look to other
          people, see your{" "}
          <Link to={`/users/${user?.id}`} className="text-purple-700 hover:underline">
            public profile
          </Link>
          .
        </p>

        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${
                tab === t.value
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            Couldn't load your account: {error}
          </p>
        )}
        {joinError && (
          <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {joinError}
          </p>
        )}

        {isLoading ? (
          <p className="mt-10 text-center text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="mt-6">
            {tab === "overview" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-base font-semibold text-white">
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                      {user?.name}
                      {user?.verifiedAt && (
                        <span
                          className="text-emerald-600"
                          title="Verified CUNY student"
                        >
                          ✓
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                      {user?.createdAt &&
                        ` · Member since ${memberSince(user.createdAt)}`}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {purchases.length}
                    </p>
                    <p className="text-xs text-gray-500">Purchases</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {sessionsBooked.length + sessionsToDeliver.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      Upcoming sessions
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {listings.length}
                    </p>
                    <p className="text-xs text-gray-500">Listings</p>
                  </div>
                </div>
              </div>
            )}

            {tab === "purchases" &&
              (purchases.length === 0 ? (
                <p className="mt-10 text-center text-sm text-gray-500">
                  You haven't bought anything yet.{" "}
                  <Link to="/home" className="text-purple-700 hover:underline">
                    Browse listings
                  </Link>
                </p>
              ) : (
                <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                  {purchases.map((order) => (
                    <li key={order.id} className="flex items-center gap-4 p-4">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {order.listing?.images?.[0] ? (
                          <img
                            src={order.listing.images[0]}
                            alt={order.listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <Link
                          to={
                            order.listing
                              ? `/listings/${order.listing.id}`
                              : "#"
                          }
                          className="text-sm font-medium text-gray-900 hover:underline"
                        >
                          {order.listing?.title || "Listing no longer available"}
                        </Link>
                        {order.listing?.seller?.name && (
                          <p className="text-xs text-gray-500">
                            Sold by {order.listing.seller.name}
                          </p>
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
                  ))}
                </ul>
              ))}

            {tab === "sessions" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Sessions you booked
                  </h2>
                  {sessionsBooked.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">
                      No sessions booked yet.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                      {sessionsBooked.map((order) => (
                        <SessionRow
                          key={order.id}
                          order={order}
                          otherName={order.listing?.seller?.name || "the tutor"}
                          onJoin={() => handleJoinAsBuyer(order)}
                        />
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Sessions you're delivering
                  </h2>
                  {sessionsToDeliver.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">
                      Nobody's booked a session with you yet.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                      {sessionsToDeliver.map((order) => {
                        const hasConversation = Boolean(
                          findConversationFor(order),
                        );
                        return (
                          <SessionRow
                            key={order.id}
                            order={order}
                            otherName="your buyer"
                            onJoin={() => handleJoinAsSeller(order)}
                            joinDisabledReason={
                              hasConversation
                                ? undefined
                                : "Waiting for the buyer to message you first"
                            }
                          />
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {tab === "listings" &&
              (listings.length === 0 ? (
                <p className="mt-10 text-center text-sm text-gray-500">
                  You haven't posted anything yet.{" "}
                  <Link to="/sell" className="text-purple-700 hover:underline">
                    Post a listing
                  </Link>
                </p>
              ) : (
                <>
                  <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </section>
                  <Link
                    to="/my-listings"
                    className="mt-4 inline-block text-sm text-purple-700 hover:underline"
                  >
                    Edit or remove a listing →
                  </Link>
                </>
              ))}

            {tab === "settings" && (
              <div className="max-w-md space-y-6">
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Name
                    </p>
                    <p className="text-sm text-gray-900">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Email
                    </p>
                    <p className="text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Verification
                    </p>
                    <p className="text-sm text-gray-900">
                      {user?.verifiedAt
                        ? "Verified CUNY student"
                        : "Not verified yet"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Saved payment methods aren't stored here — Stripe Checkout
                    collects your card at the time of each purchase.
                  </p>
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
                >
                  <h2 className="text-sm font-semibold text-gray-900">
                    Profile info
                  </h2>
                  <p className="-mt-2 text-xs text-gray-500">
                    Shown on your public profile to anyone signed in.
                  </p>

                  <div>
                    <label className="text-xs font-medium uppercase text-gray-400">
                      Major
                    </label>
                    <input
                      value={profileForm.major}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, major: e.target.value })
                      }
                      placeholder="Computer Science"
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase text-gray-400">
                      Semester
                    </label>
                    <input
                      value={profileForm.semester}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, semester: e.target.value })
                      }
                      placeholder="Junior"
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase text-gray-400">
                      Photo
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                        {profileForm.avatarUrl ? (
                          <img
                            src={profileForm.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={isProcessingAvatar}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-50"
                      >
                        {isProcessingAvatar ? "Processing…" : "Choose photo"}
                      </button>
                      {profileForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setProfileForm((prev) => ({
                              ...prev,
                              avatarUrl: "",
                            }))
                          }
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </div>

                  {profileSaveError && (
                    <p className="text-sm text-rose-600">{profileSaveError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingProfile ? "Saving…" : "Save changes"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Account;
