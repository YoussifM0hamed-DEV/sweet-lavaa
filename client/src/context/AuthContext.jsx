import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService.js';
import { tokenStore } from '../services/apiClient.js';

const AuthContext = createContext(null);

const STAFF_ROLES = ['support', 'manager', 'admin', 'super_admin'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((payload) => {
    if (payload?.token) tokenStore.set(payload.token);
    setUser(payload?.user || null);
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  /* Restore the session on boot when a token is present. */
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!tokenStore.get()) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await authService.me();
        if (!cancelled) setUser(response.data.user);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  /* The API client fires this when the server rejects our token. */
  useEffect(() => {
    const onExpired = () => {
      setUser((current) => {
        if (current) toast.error('Your session expired. Please sign in again.');
        return null;
      });
    };
    window.addEventListener('sl:session-expired', onExpired);
    return () => window.removeEventListener('sl:session-expired', onExpired);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response = await authService.login(credentials);
      applySession(response.data);
      toast.success(response.message || 'Welcome back!');
      return response.data.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (payload) => {
      const response = await authService.register(payload);
      applySession(response.data);
      toast.success(response.message || 'Your account is ready.');
      return response.data.user;
    },
    [applySession],
  );

  const loginWithGoogle = useCallback(
    async (credential) => {
      const response = await authService.loginWithGoogle(credential);
      applySession(response.data);
      toast.success(response.message || 'Signed in with Google.');
      return response.data.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* the local session is cleared regardless */
    }
    clearSession();
    toast.success('You have been signed out.');
  }, [clearSession]);

  const refresh = useCallback(async () => {
    const response = await authService.me();
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user && STAFF_ROLES.includes(user.role)),
      hasPermission: (permission) => Boolean(user?.permissions?.includes(permission)),
      login,
      register,
      loginWithGoogle,
      logout,
      refresh,
      setUser,
    }),
    [user, isLoading, login, register, loginWithGoogle, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
};

export default AuthContext;
