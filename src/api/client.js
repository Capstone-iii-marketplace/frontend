const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const BACKEND_ROOT_PATH = API_BASE_URL ? '/' : '/backend-api';

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    // The auth token lives in an httpOnly cookie the browser only sends
    // when credentials are included. Without this every call is anonymous.
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

export const authApi = {
  login(email, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  signup({ name, email, password }) {
    return apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
  logout() {
    return apiRequest('/api/auth/logout', { method: 'POST' });
  },
  me() {
    return apiRequest('/api/auth/me');
  },
};

export const marketplaceApi = {
  health() {
    return apiRequest('/health');
  },
  root() {
    return apiRequest(BACKEND_ROOT_PATH);
  },
  listings() {
    return apiRequest('/api/listings');
  },
  listing(id) {
    return apiRequest(`/api/listings/${id}`);
  },
  createListing(payload) {
    return apiRequest('/api/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
