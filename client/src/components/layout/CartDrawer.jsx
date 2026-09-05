import { Link } from 'react-router-dom';
import { FiX, FiShoppingBag, FiTrash2, FiArrowRight, FiAlertTriangle } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import Button from '../ui/Button.jsx';
import QuantityStepper from '../ui/QuantityStepper.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';
import { formatPrice } from '../../utils/format.js';

const FREE_DELIVERY_TARGET = 800;

/** Slide-over cart. For signed-in customers every total here comes from the server. */
const CartDrawer = ({ isOpen, onClose }) => {
  const { items, pricing, itemsCount, isLoading, isMutating, issues, updateQuantity, removeItem } = useCart();
  const { currency } = useSettings();

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const remaining = Math.max(0, FREE_DELIVERY_TARGET - pricing.subtotal);
  const progress = Math.min(100, (pricing.subtotal / FREE_DELIVERY_TARGET) * 100);

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-cocoa-900/50 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in-right flex-col bg-cream-50 shadow-lift">
        <header className="flex items-center justify-between border-b border-cream-300 px-6 py-5">
          <h2 className="flex items-center gap-2.5 font-display text-xl text-cocoa-800">
            <FiShoppingBag className="text-caramel-600" />
            Your cart
            {itemsCount > 0 && <span className="text-sm font-normal text-cocoa-300">({itemsCount})</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            <FiX className="text-lg" />
          </button>
        </header>

        {isLoading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center">
            <EmptyState
              icon={FiShoppingBag}
              title="Your sweet box is empty"
              message="Add a cake, a box of cookies or a gift box, and we will take care of the rest."
              actionLabel="Start shopping"
              actionTo="/products"
              className="w-full"
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {issues.length > 0 && (
                <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                  <FiAlertTriangle className="mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    {issues.map((issue) => (
                      <p key={issue.product + issue.code}>{issue.message}</p>
                    ))}
                  </div>
                </div>
              )}

              {remaining > 0 && (
                <div className="mb-5 rounded-xl bg-cream-200 p-4">
                  <p className="text-xs text-cocoa-500">
                    Add <strong className="text-cocoa-800">{formatPrice(remaining, currency)}</strong> more for free delivery.
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-400">
                    <div
                      className="h-full rounded-full bg-caramel-500 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <ul className="space-y-5">
                {items.map((item) => (
                  <li key={`${item.product}-${item.variant?.id || 'base'}`} className="flex gap-4">
                    <Link to={`/products/${item.slug}`} onClick={onClose} className="shrink-0">
                      <SmartImage src={item.image} alt={item.name} width={200} className="h-20 w-20 rounded-xl" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/products/${item.slug}`}
                        onClick={onClose}
                        className="line-clamp-2 text-sm font-semibold text-cocoa-800 transition-colors hover:text-caramel-700"
                      >
                        {item.name}
                      </Link>
                      {item.variant?.name && <p className="mt-0.5 text-xs text-cocoa-300">{item.variant.name}</p>}

                      <p className="mt-1 text-sm font-semibold text-caramel-700">{formatPrice(item.unitPrice, currency)}</p>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          onChange={(quantity) => updateQuantity(item, quantity)}
                          max={item.trackInventory === false ? 99 : item.stock || 99}
                          disabled={isMutating}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={isMutating}
                          aria-label={`Remove ${item.name}`}
                          className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-cream-300 bg-cream-100/70 px-6 py-5">
              <div className="mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-cocoa-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-cocoa-800">{formatPrice(pricing.subtotal, currency)}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatPrice(pricing.discount, currency)}</span>
                  </div>
                )}
                <p className="pt-1 text-xs text-cocoa-300">Delivery is calculated at checkout.</p>
              </div>

              <Button to="/checkout" onClick={onClose} fullWidth iconRight={FiArrowRight}>
                Checkout
              </Button>
              <Button to="/cart" onClick={onClose} variant="ghost" fullWidth className="mt-2">
                View full cart
              </Button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
