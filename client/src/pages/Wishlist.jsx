import { useEffect, useState } from 'react';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ProductGrid from '../components/product/ProductGrid.jsx';
import QuickViewModal from '../components/product/QuickViewModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { wishlistService } from '../services/commerceService.js';
import { useWishlist } from '../context/WishlistContext.jsx';

const Wishlist = () => {
  const { ids, setIds } = useWishlist();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    wishlistService
      .get()
      .then((response) => setProducts(response.data.products))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  /* Keep the grid in step when a heart is toggled from a card. */
  useEffect(() => {
    setProducts((current) => current.filter((product) => ids.includes(String(product._id))));
  }, [ids]);

  const clearAll = async () => {
    await wishlistService.clear();
    setIds([]);
    setProducts([]);
    setConfirmClear(false);
  };

  return (
    <>
      <Seo title="My wishlist" noIndex />

      <div className="container-page section">
        <PageHeader
          title="Your wishlist"
          description={products.length > 0 ? `${products.length} sweet${products.length === 1 ? '' : 's'} saved for later.` : undefined}
          breadcrumbs={[{ label: 'Wishlist' }]}
        >
          {products.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-cocoa-300 transition-colors hover:text-red-600"
            >
              <FiTrash2 /> Clear wishlist
            </button>
          )}
        </PageHeader>

        <div className="mt-10">
          {!isLoading && products.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={FiHeart}
                title="Save your favourite sweets here"
                message="Tap the heart on any product and it will be waiting for you next time."
                actionLabel="Browse products"
                actionTo="/products"
              />
            </div>
          ) : (
            <ProductGrid products={products} isLoading={isLoading} onQuickView={setQuickView} skeletonCount={4} />
          )}
        </div>
      </div>

      <QuickViewModal product={quickView} isOpen={Boolean(quickView)} onClose={() => setQuickView(null)} />

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAll}
        title="Clear your wishlist?"
        message="This removes every saved item. You can always add them back."
        confirmLabel="Clear wishlist"
      />
    </>
  );
};

export default Wishlist;
