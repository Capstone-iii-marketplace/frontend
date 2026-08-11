const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_STORAGE_KEY = 'marketplace_auth_token';
const BACKEND_ROOT_PATH = API_BASE_URL ? '/' : '/backend-api';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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
};
