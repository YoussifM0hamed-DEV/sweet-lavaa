import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import Rating from '../ui/Rating.jsx';
import Badge from '../ui/Badge.jsx';
import Spinner from '../ui/Spinner.jsx';
import { cn } from '../../utils/cn.js';
import { formatPrice, truncate } from '../../utils/format.js';
import { finalPrice, hasDiscount, discountPercent, stockStatus, productImage } from '../../utils/product.js';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

/**
 * The store's primary product tile. Handles its own add-to-cart and wishlist
 * state so it can be dropped into any grid without extra wiring.
 */
const ProductCard = ({ product, onQuickView, eager = false, className }) => {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { currency } = useSettings();

  const [isAdding, setIsAdding] = useState(false);

  const status = stockStatus(product);
  const isOut = status === 'out_of_stock';
  const saved = isWishlisted(product._id);
  const hasVariants = (product.variants?.length || 0) > 0;

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Products with options need a choice, so send the customer to the detail page.
    if (hasVariants) {
      onQuickView?.(product);
      return;
    }

    setIsAdding(true);
    try {
      await addItem(product, { quantity: 1 });
    } catch {
      /* the cart context already surfaced the reason */
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(product);
  };

  const handleQuickView = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <article className={cn('group', className)}>
      <Link
        to={`/products/${product.slug}`}
        className="card-interactive block overflow-hidden focus-visible:ring-2 focus-visible:ring-caramel-500"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-cream-200">
          <SmartImage
            src={productImage(product)}
            alt={product.name}
            width={600}
            eager={eager}
            className="h-full w-full"
            imgClassName="transition-transform duration-700 ease-smooth group-hover:scale-[1.07]"
          />

          {/* Badges */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {hasDiscount(product) && <Badge tone="sale">-{discountPercent(product)}%</Badge>}
            {product.isBestSeller && !hasDiscount(product) && <Badge tone="best">Best seller</Badge>}
            {product.isNewArrival && !product.isBestSeller && !hasDiscount(product) && <Badge tone="new">New</Badge>}
          </div>

          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            aria-pressed={saved}
            className={cn(
              'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur',
              'transition-all duration-300 ease-smooth hover:scale-110',
              saved ? 'bg-blush-300 text-cocoa-800' : 'bg-cream-50/85 text-cocoa-400 hover:text-blush-400',
            )}
          >
            <FiHeart className="text-base" fill={saved ? 'currentColor' : 'none'} />
          </button>

          {/* Out of stock veil */}
          {isOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-cocoa-900/45 backdrop-blur-[2px]">
              <span className="rounded-full bg-cream-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cocoa-700">
                Sold out
              </span>
            </div>
          )}

          {/* Hover actions */}
          {!isOut && (
            <div
              className={cn(
                'absolute inset-x-3 bottom-3 flex gap-2 opacity-0 transition-all duration-400 ease-smooth',
                'translate-y-3 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100',
              )}
            >
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cocoa-800 py-2.5 text-xs font-bold text-cream-100 shadow-lift transition-colors hover:bg-cocoa-900 disabled:opacity-70"
              >
                {isAdding ? <Spinner size="xs" /> : <FiShoppingBag />}
                {hasVariants ? 'Choose options' : 'Add to cart'}
              </button>

              {onQuickView && (
                <button
                  type="button"
                  onClick={handleQuickView}
                  aria-label={`Quick view ${product.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-50 text-cocoa-600 shadow-lift transition-colors hover:bg-cream-200"
                >
                  <FiEye />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-caramel-600">
            {product.category?.name || 'Sweet Lava'}
          </p>

          <h3 className="mt-1.5 line-clamp-2 font-display text-[1.05rem] leading-snug text-cocoa-800 transition-colors group-hover:text-caramel-700">
            {product.name}
          </h3>

          {product.shortDescription && (
            <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-relaxed text-cocoa-300">
              {truncate(product.shortDescription, 72)}
            </p>
          )}

          {product.ratingCount > 0 && (
            <Rating value={product.ratingAverage} count={product.ratingCount} size="xs" className="mt-2.5" />
          )}

          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-display text-lg font-semibold text-cocoa-800">
                {formatPrice(finalPrice(product), currency)}
              </span>
              {hasDiscount(product) && (
                <span className="text-xs text-cocoa-300 line-through">{formatPrice(product.price, currency)}</span>
              )}
            </div>

            {status === 'low_stock' && (
              <span className="text-[0.7rem] font-semibold text-amber-600">Only {product.stock} left</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
