import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage.js';

const KEY = 'sl_recently_viewed';
const MAX = 8;

export const useRecentlyViewed = () => {
  const [ids, setIds] = useLocalStorage(KEY, []);

  const track = useCallback(
    (productId) => {
      if (!productId) return;
      setIds((current) => [String(productId), ...current.filter((id) => id !== String(productId))].slice(0, MAX));
    },
    [setIds],
  );

  return { ids, track, clear: () => setIds([]) };
};

export default useRecentlyViewed;
