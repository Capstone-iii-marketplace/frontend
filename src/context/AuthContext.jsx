import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, clearStoredToken, getStoredToken, storeToken } from '../api/client';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()));

  const loadCurrentUser = useCallback(async () => {
    if (!getStoredToken()) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      clearStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    storeToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (formData) => {
    const data = await authApi.signup(formData);
    storeToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
