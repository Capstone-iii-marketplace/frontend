import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/client';

// Holds whoever is signed in right now, so any component can read it with
// useAuth() instead of passing user/login/logout down as props.
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // The token is an httpOnly cookie, so JavaScript can't check whether one
  // exists. Asking the server is the only way to know who's signed in.
  const [isLoading, setIsLoading] = useState(true);

  // Asks the server who's logged in (via the /me endpoint) since JS can't
  // read the httpOnly cookie itself. Runs once on mount below.
  const loadCurrentUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Logs in via the API, then stores the returned user so the whole app
  // re-renders as "authenticated".
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    return data.user;
  }, []);

  // Creates a new account and immediately signs the user in.
  const signup = useCallback(async (formData) => {
    const data = await authApi.signup(formData);
    setUser(data.user);
    return data.user;
  }, []);

  // Clears the server-side cookie, then clears local state in `finally` so
  // the UI still logs the user out even if the network call fails.
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear locally even if the request failed — the user asked to leave.
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      // Lets a component (Account settings) push a freshly-saved user
      // straight into context, so the navbar/profile update without a
      // reload. setUser from useState is already stable, no dep needed.
      setUser,
      isAuthenticated: Boolean(user),// true/false
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook every component uses to read/change auth state:
// const { user, isAuthenticated, login, signup, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
