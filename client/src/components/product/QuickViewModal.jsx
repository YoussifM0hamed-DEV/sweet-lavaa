import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiShoppingBag } from 'react-icons/fi';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Rating from '../ui/Rating.jsx';
import Badge from '../ui/Badge.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import QuantityStepper from '../ui/QuantityStepper.jsx';
import { formatPrice } from '../../utils/format.js';
import { finalPrice, hasDiscount, discountPercent, stockStatus, productImage } from '../../utils/product.js';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { cn } from '../../utils/cn.js';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { currency } = useSettings();

  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setVariant(product?.variants?.find((entry) => entry.isAvailable !== false) || null);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const isOut = stockStatus(product) === 'out_of_stock';
  const unitPrice = finalPrice(product) + Number(variant?.priceModifier || 0);
  const saved = isWishlisted(product._id);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await addItem(product, { quantity, variant });
      onClose();
    } catch {
      /* the cart context already showed the error */
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" className="sm:max-w-4xl">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl">
          <SmartImage src={productImage(product)} alt={product.name} width={800} className="aspect-square w-full" />
          {hasDiscount(product) && (
            <Badge tone="sale" className="absolute left-3 top-3">
              -{discountPercent(product)}%
            </Badge>
          )}
        </div>

        <div className="flex flex-col">
          <p className="eyebrow">{product.category?.name}</p>
          <h2 className="mt-2 font-display text-2xl leading-tight text-cocoa-800">{product.name}</h2>

          {product.ratingCount > 0 && (
            <Rating value={product.ratingAverage} count={product.ratingCount} size="sm" className="mt-2.5" />
          )}

          {product.shortDescription && (
            <p className="mt-3 text-sm leading-relaxed text-cocoa-400">{product.shortDescription}</p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold text-cocoa-800">{formatPrice(unitPrice, currency)}</span>
            {hasDiscount(product) && (
              <span className="text-sm text-cocoa-300 line-through">{formatPrice(product.price, currency)}</span>
            )}
          </div>

          {product.variants?.length > 0 && (
            <div className="mt-5">
              <p className="label">Choose an option</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((option) => {
                  const disabled = option.isAvailable === false;
                  const selected = variant?._id === option._id;
                  return (
                    <button
                      key={option._id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setVariant(option)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200',
                        selected
                          ? 'border-cocoa-800 bg-cocoa-800 text-cream-100'
                          : 'border-cream-400 text-cocoa-600 hover:border-cocoa-400',
                        disabled && 'cursor-not-allowed line-through opacity-40',
                      )}
                    >
                      {option.name}
                      {option.priceModifier > 0 && ` +${option.priceModifier}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6">
            {isOut ? (
              <div className="rounded-xl bg-cream-200 px-4 py-3 text-center text-sm font-semibold text-cocoa-400">
                This item is currently sold out.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <QuantityStepper value={quantity} onChange={setQuantity} max={product.trackInventory ? product.stock : 99} />
                <Button onClick={handleAdd} isLoading={isAdding} icon={FiShoppingBag} className="flex-1">
                  Add to cart
                </Button>
                <button
                  type="button"
                  onClick={() => toggle(product)}
                  aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
                    saved ? 'border-blush-300 bg-blush-100 text-blush-400' : 'border-cream-400 text-cocoa-400 hover:text-blush-400',
                  )}
                >
                  <FiHeart fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>
            )}

            <Link
              to={`/products/${product.slug}`}
              onClick={onClose}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-caramel-700 transition-colors hover:text-caramel-800"
            >
              View full details <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickViewModal;
