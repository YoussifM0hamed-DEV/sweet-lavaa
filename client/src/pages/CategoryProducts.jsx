import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SmartImage from '../components/ui/SmartImage.jsx';
import ProductGrid from '../components/product/ProductGrid.jsx';
import QuickViewModal from '../components/product/QuickViewModal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Select } from '../components/ui/Input.jsx';
import { productService, categoryService } from '../services/catalogService.js';
import { SORT_OPTIONS } from '../utils/constants.js';

const CategoryProducts = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'popular';

  useEffect(() => {
    categoryService
      .getBySlug(slug)
      .then((response) => setCategory(response.data.category))
      .catch(() => setCategory(null));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    productService
      .list({ category: slug, page, sort, limit: 12 })
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
  }, [slug, page, sort]);

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => next.set(key, String(value)));
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <Seo
        title={category?.name || 'Category'}
        description={category?.description}
        image={category?.image?.url}
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SmartImage src={category?.image?.url} alt="" width={1600} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-cocoa-900/90 via-cocoa-900/70 to-cocoa-900/35" />
        </div>

        <div className="container-page relative py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-cream-300/60">
            <a href="/" className="hover:text-caramel-300">Home</a>
            <span className="mx-1.5">/</span>
            <a href="/categories" className="hover:text-caramel-300">Categories</a>
            <span className="mx-1.5">/</span>
            <span className="text-cream-100">{category?.name}</span>
          </nav>

          {category?.tagline && <p className="eyebrow text-caramel-300">{category.tagline}</p>}
          <h1 className="mt-3 text-display-lg text-cream-50">{category?.name || 'Loading…'}</h1>
          {category?.description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream-200/75">{category.description}</p>
          )}
        </div>
      </div>

      <div className="container-page section">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-cocoa-400">
            {isLoading ? 'Loading…' : `${meta.total} product${meta.total === 1 ? '' : 's'}`}
          </p>
          <Select
            value={sort}
            onChange={(event) => update({ sort: event.target.value, page: 1 })}
            options={SORT_OPTIONS}
            className="w-auto min-w-[11rem] py-2.5 text-sm"
            aria-label="Sort products"
          />
        </div>

        <ProductGrid
          products={products}
          isLoading={isLoading}
          onQuickView={setQuickView}
          emptyTitle="Nothing in this category yet"
          emptyMessage="We are working on it. In the meantime, everything else is a click away."
          emptyAction={{ label: 'Browse all products', to: '/products' }}
        />

        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onChange={(next) => {
            update({ page: next });
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          className="mt-12"
        />
      </div>

      <QuickViewModal product={quickView} isOpen={Boolean(quickView)} onClose={() => setQuickView(null)} />
    </>
  );
};

export default CategoryProducts;
