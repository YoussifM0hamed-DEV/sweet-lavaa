import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { wishlistService } from '../services/commerceService.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [ids, setIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setIds([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    wishlistService
      .ids()
      .then((response) => {
        if (!cancelled) setIds(response.data.ids);
      })
      .catch(() => {
        /* a failed wishlist load should not interrupt browsing */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading]);

  const isWishlisted = useCallback((productId) => ids.includes(String(productId)), [ids]);

  const toggle = useCallback(
    async (product) => {
      if (!isAuthenticated) {
        toast.error('Sign in to save your favourites.');
        return false;
      }

      const productId = String(product._id || product.id);
      const wasSaved = ids.includes(productId);

      // Optimistic update — the heart responds instantly.
      setIds((current) => (wasSaved ? current.filter((id) => id !== productId) : [...current, productId]));

      try {
        const response = wasSaved
          ? await wishlistService.remove(productId)
          : await wishlistService.add(productId);
        setIds(response.data.ids);
        toast.success(wasSaved ? 'Removed from your wishlist.' : `${product.name} saved to your wishlist.`);
        return !wasSaved;
      } catch (error) {
        setIds((current) => (wasSaved ? [...current, productId] : current.filter((id) => id !== productId)));
        toast.error(error.message);
        return wasSaved;
      }
    },
    [ids, isAuthenticated],
  );

  const value = useMemo(
    () => ({ ids, count: ids.length, isLoading, isWishlisted, toggle, setIds }),
    [ids, isLoading, isWishlisted, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside a WishlistProvider.');
  return context;
};

export default WishlistContext;
