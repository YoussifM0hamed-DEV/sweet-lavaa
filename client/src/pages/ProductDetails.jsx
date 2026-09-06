import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  FiHeart, FiShoppingBag, FiTruck, FiShield, FiAlertCircle, FiChevronDown, FiZap,
} from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ProductGallery from '../components/product/ProductGallery.jsx';
import ProductCarousel from '../components/product/ProductCarousel.jsx';
import ReviewSection from '../components/product/ReviewSection.jsx';
import Rating from '../components/ui/Rating.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { productService } from '../services/catalogService.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import useRecentlyViewed from '../hooks/useRecentlyViewed.js';
import { formatPrice } from '../utils/format.js';
import { finalPrice, hasDiscount, discountPercent, stockStatus, productBadges } from '../utils/product.js';
import { cn } from '../utils/cn.js';

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-cream-300">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-4 text-left font-semibold text-cocoa-700"
      >
        {title}
        <FiChevronDown className={cn('text-cocoa-300 transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="pb-5 text-sm leading-relaxed text-cocoa-400">{children}</div>}
    </div>
  );
};

const DetailsSkeleton = () => (
  <div className="container-page py-12">
    <div className="grid gap-10 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="space-y-4 py-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-14 w-full rounded-full" />
      </div>
    </div>
  </div>
);

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { currency, settings } = useSettings();
  const { track } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);
    setQuantity(1);

    productService
      .getBySlug(slug)
      .then((response) => {
        if (cancelled) return;
        const loaded = response.data.product;
        setProduct(loaded);
        setRelated(response.data.related);
        setVariant(loaded.variants?.find((entry) => entry.isAvailable !== false) || null);
        track(loaded._id);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `track` is stable per render of the hook; slug is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (isLoading) return <DetailsSkeleton />;

  if (notFound || !product) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-display-sm">We could not find that sweet</h1>
        <p className="lede mt-3 max-w-md">It may have sold out for good, or the link may be out of date.</p>
        <Button to="/products" className="mt-7">
          Browse all products
        </Button>
      </div>
    );
  }

  const status = stockStatus(product);
  const isOut = status === 'out_of_stock';
  const unitPrice = finalPrice(product) + Number(variant?.priceModifier || 0);
  const saved = isWishlisted(product._id);
  const maxQuantity = product.trackInventory ? Math.max(1, product.stock) : 99;

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await addItem(product, { quantity, variant });
    } catch {
      /* the cart context reported the reason */
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      await addItem(product, { quantity, variant });
      navigate('/checkout');
    } catch {
      setIsBuying(false);
    }
  };

  return (
    <>
      <Seo
        title={product.name}
        description={product.shortDescription}
        image={product.images?.[0]?.url}
        type="product"
        product={product}
      />

      <div className="container-page pt-8">
        <PageHeader
          breadcrumbs={[
            { label: 'Products', to: '/products' },
            ...(product.category ? [{ label: product.category.name, to: `/categories/${product.category.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="container-page pb-16 pt-2">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={product.images} alt={product.name} badges={productBadges(product)} />
          </div>

          <div>
            {product.category && (
              <Link to={`/categories/${product.category.slug}`} className="eyebrow transition-colors hover:text-caramel-800">
                {product.category.name}
              </Link>
            )}

            <h1 className="mt-3 text-display-md text-balance">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {product.ratingCount > 0 ? (
                <a href="#reviews" className="transition-opacity hover:opacity-75">
                  <Rating value={product.ratingAverage} count={product.ratingCount} size="sm" />
                </a>
              ) : (
                <span className="text-sm text-cocoa-300">No reviews yet</span>
              )}

              {product.soldCount > 20 && <span className="text-sm text-cocoa-300">{product.soldCount}+ sold</span>}
            </div>

            {product.shortDescription && <p className="lede mt-5">{product.shortDescription}</p>}

            <div className="mt-7 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-semibold text-cocoa-800">
                {formatPrice(unitPrice, currency)}
              </span>
              {hasDiscount(product) && (
                <>
                  <span className="text-lg text-cocoa-300 line-through">{formatPrice(product.price, currency)}</span>
                  <Badge tone="sale">Save {discountPercent(product)}%</Badge>
                </>
              )}
            </div>

            <div className="mt-4">
              {isOut ? (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                  <FiAlertCircle /> Sold out — check back tomorrow
                </span>
              ) : status === 'low_stock' ? (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600">
                  <FiZap /> Only {product.stock} left today
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" /> In stock, baked today
                </span>
              )}
            </div>

            {product.variants?.length > 0 && (
              <div className="mt-7">
                <p className="label">Size / option</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((option) => {
                    const disabled = option.isAvailable === false;
                    const selected = variant?._id === option._id;
                    return (
                      <button
                        key={option._id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setVariant(option)}
                        aria-pressed={selected}
                        className={cn(
                          'rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200',
                          selected
                            ? 'border-cocoa-800 bg-cocoa-800 text-cream-100 shadow-soft'
                            : 'border-cream-400 bg-cream-50 text-cocoa-600 hover:border-cocoa-300',
                          disabled && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        <span className="block font-semibold">{option.name}</span>
                        <span className={cn('text-xs', selected ? 'text-cream-300/80' : 'text-cocoa-300')}>
                          {option.priceModifier > 0
                            ? `+${formatPrice(option.priceModifier, currency)}`
                            : disabled
                              ? 'Unavailable'
                              : 'Included'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} disabled={isOut} />

              <Button
                onClick={handleAdd}
                isLoading={isAdding}
                disabled={isOut}
                icon={FiShoppingBag}
                size="lg"
                className="min-w-[12rem] flex-1"
              >
                {isOut ? 'Sold out' : 'Add to cart'}
              </Button>

              <button
                type="button"
                onClick={() => toggle(product)}
                aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={saved}
                className={cn(
                  'flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full border transition-all duration-300 hover:scale-105',
                  saved
                    ? 'border-blush-300 bg-blush-100 text-blush-400'
                    : 'border-cream-400 text-cocoa-400 hover:text-blush-400',
                )}
              >
                <FiHeart className="text-lg" fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>

            {!isOut && (
              <Button onClick={handleBuyNow} isLoading={isBuying} variant="outline" size="lg" fullWidth className="mt-3">
                Buy it now
              </Button>
            )}

            <div className="mt-7 grid gap-3 rounded-2xl bg-cream-200/70 p-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <FiTruck className="mt-0.5 shrink-0 text-caramel-600" />
                <div>
                  <p className="text-sm font-semibold text-cocoa-700">Fast delivery</p>
                  <p className="text-xs text-cocoa-400">
                    {settings.delivery?.info || 'Same-day across Cairo before 4 PM.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiShield className="mt-0.5 shrink-0 text-caramel-600" />
                <div>
                  <p className="text-sm font-semibold text-cocoa-700">Pay on delivery</p>
                  <p className="text-xs text-cocoa-400">Pay the courier in cash when your order arrives.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {product.description && (
                <Accordion title="Description" defaultOpen>
                  <p className="whitespace-pre-line">{product.description}</p>
                </Accordion>
              )}

              {product.ingredients?.length > 0 && (
                <Accordion title="Ingredients">
                  <ul className="flex flex-wrap gap-2">
                    {product.ingredients.map((item) => (
                      <li key={item} className="rounded-full bg-cream-200 px-3 py-1 text-xs text-cocoa-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                </Accordion>
              )}

              {product.allergens?.length > 0 && (
                <Accordion title="Allergens">
                  <p className="mb-3">This product contains, or may contain traces of:</p>
                  <ul className="flex flex-wrap gap-2">
                    {product.allergens.map((item) => (
                      <li key={item} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                        {item}
                      </li>
                    ))}
                  </ul>
                </Accordion>
              )}

              <Accordion title="Storage & serving">
                <ul className="space-y-1.5">
                  {product.weight && <li>Weight: {product.weight}</li>}
                  {product.preparationTime && <li>Preparation: {product.preparationTime}</li>}
                  <li>Keep refrigerated and enjoy within three days of delivery.</li>
                  <li>Bring to room temperature for twenty minutes before serving for the best texture.</li>
                </ul>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-cream-300 bg-cream-200/40">
        <div className="container-page section-tight">
          <ReviewSection product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="section-tight">
          <div className="container-page">
            <SectionHeading eyebrow="You might also like" title="Goes well with this" />
            <ProductCarousel products={related} />
          </div>
        </section>
      )}
    </>
  );
};

export default ProductDetails;
