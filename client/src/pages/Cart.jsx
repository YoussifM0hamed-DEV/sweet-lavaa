import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiTrash2, FiArrowRight, FiTag, FiX, FiAlertTriangle } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SmartImage from '../components/ui/SmartImage.jsx';
import Button from '../components/ui/Button.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { formatPrice } from '../utils/format.js';

const CouponBox = () => {
  const { coupon, applyCoupon, removeCoupon } = useCart();
  const { isAuthenticated } = useAuth();
  const { currency } = useSettings();

  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;

    setError('');
    setIsApplying(true);
    try {
      await applyCoupon(code.trim());
      setCode('');
    } catch (applyError) {
      setError(applyError.message);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <p className="rounded-xl bg-cream-200 px-4 py-3 text-xs text-cocoa-400">
        <Link to="/login" className="font-semibold text-caramel-700 underline">
          Sign in
        </Link>{' '}
        to apply a coupon code.
      </p>
    );
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-emerald-700">
          <FiTag className="shrink-0" />
          <span className="truncate">{coupon.code} applied</span>
        </span>
        <button
          type="button"
          onClick={removeCoupon}
          aria-label="Remove coupon"
          className="shrink-0 rounded-full p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <FiX />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Coupon code"
          aria-label="Coupon code"
          className="input flex-1 uppercase tracking-wider"
        />
        <Button type="submit" variant="outline" size="sm" isLoading={isApplying} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
};

const Cart = () => {
  const { items, pricing, itemsCount, issues, isLoading, isMutating, updateQuantity, removeItem, clearCart } = useCart();
  const { currency, settings } = useSettings();
  const [confirmClear, setConfirmClear] = useState(false);

  const belowMinimum =
    settings.commerce?.minimumOrderAmount > 0 && pricing.subtotal < settings.commerce.minimumOrderAmount;

  return (
    <>
      <Seo title="Your cart" noIndex />

      <div className="container-page section">
        <PageHeader
          title="Your cart"
          description={itemsCount > 0 ? `${itemsCount} item${itemsCount === 1 ? '' : 's'} ready to go.` : undefined}
          breadcrumbs={[{ label: 'Cart' }]}
        />

        {isLoading ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-card" />
              ))}
            </div>
            <Skeleton className="h-80 w-full rounded-card" />
          </div>
        ) : items.length === 0 ? (
          <div className="card mt-10">
            <EmptyState
              icon={FiShoppingBag}
              title="Your sweet box is empty"
              message="Nothing here yet. Have a look at what came out of the oven this morning."
              actionLabel="Start shopping"
              actionTo="/products"
              secondary={
                <Link to="/categories" className="btn-outline btn-sm">
                  Browse categories
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              {issues.length > 0 && (
                <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <FiAlertTriangle className="mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">Some items need your attention</p>
                    {issues.map((issue) => (
                      <p key={issue.product + issue.code}>{issue.message}</p>
                    ))}
                  </div>
                </div>
              )}

              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={`${item.product}-${item.variant?.id || 'base'}`} className="card p-4 sm:p-5">
                    <div className="flex gap-4 sm:gap-5">
                      <Link to={`/products/${item.slug}`} className="shrink-0">
                        <SmartImage
                          src={item.image}
                          alt={item.name}
                          width={240}
                          className="h-24 w-24 rounded-xl sm:h-28 sm:w-28"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {item.categoryName && (
                              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-caramel-600">
                                {item.categoryName}
                              </p>
                            )}
                            <Link
                              to={`/products/${item.slug}`}
                              className="mt-0.5 block font-display text-base leading-snug text-cocoa-800 transition-colors hover:text-caramel-700 sm:text-lg"
                            >
                              {item.name}
                            </Link>
                            {item.variant?.name && <p className="mt-0.5 text-xs text-cocoa-300">{item.variant.name}</p>}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item)}
                            disabled={isMutating}
                            aria-label={`Remove ${item.name}`}
                            className="shrink-0 rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                          <QuantityStepper
                            size="sm"
                            value={item.quantity}
                            onChange={(quantity) => updateQuantity(item, quantity)}
                            max={item.trackInventory === false ? 99 : item.stock || 99}
                            disabled={isMutating}
                          />

                          <div className="text-right">
                            {item.originalPrice > item.unitPrice && (
                              <span className="mr-2 text-xs text-cocoa-300 line-through">
                                {formatPrice(item.originalPrice * item.quantity, currency)}
                              </span>
                            )}
                            <span className="font-display text-lg font-semibold text-cocoa-800">
                              {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Link to="/products" className="btn-ghost">
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-sm font-medium text-cocoa-300 transition-colors hover:text-red-600"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="card p-6">
                <h2 className="font-display text-xl text-cocoa-800">Order summary</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between text-cocoa-500">
                    <span>Subtotal ({itemsCount} item{itemsCount === 1 ? '' : 's'})</span>
                    <span className="font-semibold text-cocoa-800">{formatPrice(pricing.subtotal, currency)}</span>
                  </div>

                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="font-semibold">-{formatPrice(pricing.discount, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-cocoa-500">
                    <span>Delivery</span>
                    <span className="text-cocoa-300">Calculated at checkout</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-cream-300 pt-5">
                  <CouponBox />
                </div>

                <div className="mt-5 flex items-baseline justify-between border-t border-cream-300 pt-5">
                  <span className="font-display text-lg text-cocoa-800">Total</span>
                  <span className="font-display text-2xl font-semibold text-cocoa-800">
                    {formatPrice(pricing.subtotal - pricing.discount, currency)}
                  </span>
                </div>

                {belowMinimum && (
                  <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    The minimum order value is {formatPrice(settings.commerce.minimumOrderAmount, currency)}. Add{' '}
                    {formatPrice(settings.commerce.minimumOrderAmount - pricing.subtotal, currency)} more to check out.
                  </p>
                )}

                <Button
                  to="/checkout"
                  fullWidth
                  size="lg"
                  iconRight={FiArrowRight}
                  className="mt-5"
                  disabled={belowMinimum || issues.length > 0}
                >
                  Proceed to checkout
                </Button>

                <p className="mt-4 text-center text-xs leading-relaxed text-cocoa-300">
                  Pay cash on delivery. Delivery fees and any discounts are confirmed on the next step.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          await clearCart();
          setConfirmClear(false);
        }}
        title="Clear your cart?"
        message="This removes every item. You can always add them back."
        confirmLabel="Clear cart"
      />
    </>
  );
};

export default Cart;
