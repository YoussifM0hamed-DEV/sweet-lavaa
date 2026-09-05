import { useEffect } from 'react';

/** Prevents the page behind a modal or drawer from scrolling. */
export const useLockBodyScroll = (locked) => {
  useEffect(() => {
    if (!locked) return undefined;

    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [locked]);
};

export default useLockBodyScroll;
