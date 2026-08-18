// Single gateway between the frontend and the Express backend. Every API
// call in the app funnels through apiRequest() below, so fetch options,
// error handling, and cookie behavior stay consistent in one place.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Core fetch wrapper used by every function in this file.
// - Sets Content-Type: application/json automatically when there's a body.
// - Always sends credentials so the httpOnly JWT cookie is attached.
// - Throws a plain Error with the server's message on any non-OK response,
//   so callers can just try/catch instead of checking response.ok everywhere.
export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    // The auth token lives in an httpOnly cookie the browser only sends
    // when credentials are included. Without this every call is anonymous.
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

// Auth endpoints: signup, login, logout, and "who am I right now" (me).
export const authApi = {
  login(email, password) {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  signup({ name, email, password }) {
    return apiRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },
  logout() {
    return apiRequest("/api/auth/logout", { method: "POST" });
  },
  me() {
    return apiRequest("/api/auth/me");
  },
};

// Listing CRUD: browsing, the current user's own listings, and create/edit/delete.
export const marketplaceApi = {
  listings() {
    return apiRequest("/api/listings");
  },
  myListings() {
    return apiRequest("/api/listings/mine");
  },
  listing(id) {
    return apiRequest(`/api/listings/${id}`);
  },
  createListing(payload) {
    return apiRequest("/api/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateListing(id, payload) {
    return apiRequest(`/api/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteListing(id) {
    return apiRequest(`/api/listings/${id}`, { method: "DELETE" });
  },
};

export const ordersApi = {
  mine() {
    return apiRequest("/api/orders/mine");
  },
  // Starts a Stripe Checkout for the given listing ids and returns
  // { url } to redirect the browser to.
  createCheckoutSession(listingIds) {
    return apiRequest("/api/orders/checkout-session", {
      method: "POST",
      body: JSON.stringify({ listingIds }),
    });
  },
};

// Chat threads. A conversation is one (listing, buyer) pair — the seller is
// whoever owns the listing, so it isn't stored on the conversation itself.
export const chatApi = {
  conversations() {
    return apiRequest("/api/conversations");
  },
  // Idempotent: opening a chat twice returns the same thread, never a copy.
  openConversation(listingId) {
    return apiRequest("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
  },
  messages(conversationId) {
    return apiRequest(`/api/conversations/${conversationId}/messages`);
  },
};

// review api
export const reviewsApi = {
  forSeller(sellerId) {
    return apiRequest(`/api/reviews/seller/${sellerId}`);
  },
  create(payload) {
    return apiRequest("/api/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return apiRequest(`/api/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  remove(id) {
    return apiRequest(`/api/reviews/${id}`, { method: "DELETE" });
  },
};
