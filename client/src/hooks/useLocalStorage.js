import { useCallback, useState } from 'react';

/** useState backed by localStorage, safe when storage is unavailable. */
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const update = useCallback(
    (next) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? next(current) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* quota or private mode — keep the in-memory value */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
};

export default useLocalStorage;
