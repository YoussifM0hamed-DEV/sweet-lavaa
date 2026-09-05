import { useEffect } from 'react';

export const useDocumentTitle = (title, { suffix = 'Sweet Lava' } = {}) => {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = title.includes(suffix) ? title : `${title} · ${suffix}`;
    return () => {
      document.title = previous;
    };
  }, [title, suffix]);
};

export default useDocumentTitle;
