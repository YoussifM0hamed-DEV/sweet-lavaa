import { useEffect, useState } from 'react';
import { FiX, FiSliders } from 'react-icons/fi';
import Button from '../ui/Button.jsx';
import Rating from '../ui/Rating.jsx';
import { cn } from '../../utils/cn.js';
import { formatPrice } from '../../utils/format.js';

const FilterGroup = ({ title, children }) => (
  <div className="border-b border-cream-300 py-5 first:pt-0 last:border-b-0">
    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-cocoa-700">{title}</h3>
    {children}
  </div>
);

const CheckRow = ({ checked, onChange, children, count }) => (
  <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-cocoa-500 transition-colors hover:text-cocoa-800">
    <span
      className={cn(
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200',
        checked ? 'border-cocoa-800 bg-cocoa-800' : 'border-cocoa-200 bg-cream-50',
      )}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-cream-100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M2 6.5L4.5 9L10 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    <span className="flex-1">{children}</span>
    {count !== undefined && <span className="text-xs text-cocoa-200">{count}</span>}
  </label>
);

/**
 * Catalogue filter panel. Renders inline on desktop and as a bottom sheet on
 * mobile — the mobile layout is designed, not just a squeezed sidebar.
 */
const ProductFilters = ({ categories = [], filters, onChange, onReset, priceRange, activeCount = 0, currency = 'EGP' }) => {
  // filters.maxPrice is '' when unset, so `??` is not enough of a fallback here.
  const resolveMax = () =>
    filters.maxPrice === '' || filters.maxPrice == null ? priceRange.max : Number(filters.maxPrice);

  const [localMax, setLocalMax] = useState(resolveMax);

  useEffect(() => {
    setLocalMax(resolveMax());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.maxPrice, priceRange.max]);

  const selectedCategories = filters.category ? filters.category.split(',') : [];

  const toggleCategory = (slug) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((entry) => entry !== slug)
      : [...selectedCategories, slug];
    onChange({ category: next.join(','), page: 1 });
  };

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between pb-4">
        <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
          <FiSliders className="text-caramel-600" /> Filters
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-caramel-700 hover:text-caramel-800"
          >
            <FiX /> Clear ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup title="Category">
        <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
          {categories.map((category) => (
            <CheckRow
              key={category._id}
              checked={selectedCategories.includes(category.slug)}
              onChange={() => toggleCategory(category.slug)}
              count={category.productsCount}
            >
              {category.name}
            </CheckRow>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="px-1">
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            value={localMax}
            onChange={(event) => setLocalMax(Number(event.target.value))}
            onMouseUp={() => onChange({ maxPrice: localMax, page: 1 })}
            onTouchEnd={() => onChange({ maxPrice: localMax, page: 1 })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cream-400 accent-caramel-500"
            aria-label="Maximum price"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-cocoa-400">
            <span>{formatPrice(priceRange.min, currency)}</span>
            <span className="font-semibold text-cocoa-700">Up to {formatPrice(localMax, currency)}</span>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="space-y-0.5">
          {[4, 3, 2].map((stars) => (
            <CheckRow
              key={stars}
              checked={Number(filters.rating) === stars}
              onChange={() => onChange({ rating: Number(filters.rating) === stars ? '' : stars, page: 1 })}
            >
              <span className="flex items-center gap-2">
                <Rating value={stars} size="xs" showValue={false} />
                <span className="text-xs">& up</span>
              </span>
            </CheckRow>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability & offers">
        <div className="space-y-0.5">
          <CheckRow
            checked={filters.inStock === 'true'}
            onChange={() => onChange({ inStock: filters.inStock === 'true' ? '' : 'true', page: 1 })}
          >
            In stock only
          </CheckRow>
          <CheckRow
            checked={filters.onSale === 'true'}
            onChange={() => onChange({ onSale: filters.onSale === 'true' ? '' : 'true', page: 1 })}
          >
            On sale
          </CheckRow>
          <CheckRow
            checked={filters.bestSeller === 'true'}
            onChange={() => onChange({ bestSeller: filters.bestSeller === 'true' ? '' : 'true', page: 1 })}
          >
            Best sellers
          </CheckRow>
          <CheckRow
            checked={filters.newArrival === 'true'}
            onChange={() => onChange({ newArrival: filters.newArrival === 'true' ? '' : 'true', page: 1 })}
          >
            New arrivals
          </CheckRow>
        </div>
      </FilterGroup>

      {activeCount > 0 && (
        <div className="pt-5">
          <Button variant="outline" size="sm" fullWidth onClick={onReset}>
            Reset all filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
