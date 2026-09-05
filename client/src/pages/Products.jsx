import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiSearch } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ProductGrid from '../components/product/ProductGrid.jsx';
import ProductFilters from '../components/product/ProductFilters.jsx';
import QuickViewModal from '../components/product/QuickViewModal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Select } from '../components/ui/Input.jsx';
import { productService, categoryService } from '../services/catalogService.js';
import { SORT_OPTIONS } from '../utils/constants.js';
import { useSettings } from '../context/SettingsContext.jsx';
import useLockBodyScroll from '../hooks/useLockBodyScroll.js';
import useDebounce from '../hooks/useDebounce.js';

const DEFAULTS = {
  page: 1, limit: 12, sort: 'popular', search: '', category: '',
  minPrice: '', maxPrice: '', rating: '', inStock: '', onSale: '', bestSeller: '', newArrival: '',
};

const FILTER_KEYS = ['category', 'minPrice', 'maxPrice', 'rating', 'inStock', 'onSale', 'bestSeller', 'newArrival'];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currency } = useSettings();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);

  const filters = useMemo(() => {
    const current = { ...DEFAULTS };
    searchParams.forEach((value, key) => {
      current[key] = value;
    });
    return current;
  }, [searchParams]);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useLockBodyScroll(filtersOpen);

  /** Writes filter changes back to the URL so results stay shareable. */
  const updateFilters = useCallback(
    (changes) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) => {
            if (value === '' || value === undefined || value === null || value === DEFAULTS[key]) next.delete(key);
            else next.set(key, String(value));
          });
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (debouncedSearch !== filters.search) updateFilters({ search: debouncedSearch, page: 1 });
    // Only react to the debounced value; filters.search is the mirror of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    Promise.allSettled([categoryService.list(), productService.priceRange()]).then(([categoriesResult, rangeResult]) => {
      if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value.data.categories);
      if (rangeResult.status === 'fulfilled') setPriceRange(rangeResult.value.data);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined));

    productService
      .list(params)
      .then((response) => {
        if (cancelled) return;
        setProducts(response.data.products);
        setMeta(response.meta);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const activeCount = FILTER_KEYS.filter((key) => filters[key] && filters[key] !== DEFAULTS[key]).length;

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const goToPage = (page) => {
    updateFilters({ page });
    window.scrollTo({ top: 240, behavior: 'smooth' });
  };

  const filterPanel = (
    <ProductFilters
      categories={categories}
      filters={filters}
      onChange={updateFilters}
      onReset={resetFilters}
      priceRange={priceRange}
      activeCount={activeCount}
      currency={currency}
    />
  );

  return (
    <>
      <Seo
        title="All products"
        description="Browse every cake, cookie, cheesecake, brownie, cupcake, donut and gift box we bake at Sweet Lava."
      />

      <div className="bg-warm-gradient">
        <div className="container-page py-12 md:py-16">
          <PageHeader
            title={filters.search ? `Results for "${filters.search}"` : 'Everything we bake'}
            description={
              filters.search
                ? `${meta.total} product${meta.total === 1 ? '' : 's'} matched your search.`
                : 'Thirty-odd recipes, baked in small batches, delivered across Cairo.'
            }
            breadcrumbs={[{ label: 'Products' }]}
          />
        </div>
      </div>

      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">{filterPanel}</div>
          </aside>

          <div className="min-w-0">
            {/* Toolbar */}
            {/* Stacks on phones so the search field keeps a usable width. */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:min-w-0 sm:max-w-xs sm:flex-1">
                <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-300" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="input pl-10"
                />
              </div>

              <div className="flex items-center gap-3 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="btn-outline btn-sm shrink-0 lg:hidden"
                  aria-label="Open filters"
                >
                  <FiFilter />
                  Filters
                  {activeCount > 0 && (
                    <span className="ml-1 rounded-full bg-caramel-500 px-1.5 text-[0.65rem] text-white">
                      {activeCount}
                    </span>
                  )}
                </button>

                <span className="hidden text-sm text-cocoa-300 sm:block">
                  {isLoading ? 'Loading…' : `${meta.total} product${meta.total === 1 ? '' : 's'}`}
                </span>
                <Select
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value, page: 1 })}
                  options={SORT_OPTIONS}
                  className="min-w-[10.5rem] flex-1 py-2.5 text-sm sm:w-auto sm:flex-none"
                  aria-label="Sort products"
                />
              </div>
            </div>

            <ProductGrid
              products={products}
              isLoading={isLoading}
              onQuickView={setQuickView}
              emptyTitle="No sweets match those filters"
              emptyMessage="Try widening your price range or clearing a filter or two."
              emptyAction={{ label: 'Clear filters', to: '/products' }}
            />

            <Pagination page={meta.page} totalPages={meta.totalPages} onChange={goToPage} className="mt-12" />
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 animate-fade-in cursor-default bg-cocoa-900/50 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-fade-up overflow-y-auto rounded-t-3xl bg-cream-50 p-6">
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
              className="absolute right-5 top-5 rounded-full p-2 text-cocoa-300 hover:bg-cream-200"
            >
              <FiX />
            </button>
            {filterPanel}
            <button type="button" onClick={() => setFiltersOpen(false)} className="btn-primary mt-6 w-full">
              Show {meta.total} result{meta.total === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}

      <QuickViewModal product={quickView} isOpen={Boolean(quickView)} onClose={() => setQuickView(null)} />
    </>
  );
};

export default Products;
