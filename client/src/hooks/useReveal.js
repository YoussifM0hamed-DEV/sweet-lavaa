import { useEffect, useRef } from 'react';

/**
 * Adds `is-visible` when the element scrolls into view, driving the CSS
 * reveal animation. Observes once and then disconnects.
 */
export const useReveal = ({ threshold = 0.12, rootMargin = '0px 0px -60px 0px' } = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
};

export default useReveal;
