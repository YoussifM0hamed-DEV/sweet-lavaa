import { useRef, useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from './ProductCard.jsx';
import { ProductCardSkeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';

/** Horizontally scrollable product rail used on the home page and detail pages. */
const ProductCarousel = ({ products = [], isLoading = false, onQuickView, skeletonCount = 4 }) => {
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const node = scrollerRef.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 8);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
  }, [products]);

  const scrollBy = (direction) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * (node.clientWidth * 0.8), behavior: 'smooth' });
  };

  const arrowClass = (enabled) =>
    cn(
      'flex h-10 w-10 items-center justify-center rounded-full border border-cream-400 bg-cream-50 text-cocoa-600 shadow-soft transition-all duration-200',
      enabled ? 'hover:-translate-y-0.5 hover:bg-cocoa-800 hover:text-cream-100' : 'cursor-not-allowed opacity-35',
    );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!products.length) return null;

  return (
    // overflow-x-clip (not hidden) keeps the rail from widening the page while
    // still letting the cards' hover lift and shadow spill vertically.
    <div className="relative overflow-x-clip">
      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 sm:gap-6"
      >
        {products.map((product) => (
          <div
            key={product._id}
            className="w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-[calc(45%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
          >
            <ProductCard product={product} onQuickView={onQuickView} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={() => scrollBy(-1)} disabled={!canScrollLeft} className={arrowClass(canScrollLeft)} aria-label="Scroll left">
          <FiChevronLeft />
        </button>
        <button type="button" onClick={() => scrollBy(1)} disabled={!canScrollRight} className={arrowClass(canScrollRight)} aria-label="Scroll right">
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default ProductCarousel;
