import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiCheck, FiPackage, FiTruck, FiHome, FiClock, FiXCircle, FiCreditCard, FiMapPin,
} from 'react-icons/fi';
import Seo from '../../components/ui/Seo.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { orderService } from '../../services/commerceService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDateTime, formatDate } from '../../utils/format.js';
import { ORDER_STATUS_META, ORDER_STATUS_FLOW, PAYMENT_STATUS_META, PAYMENT_METHOD_META } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const STEP_ICONS = { pending: FiClock, confirmed: FiCheck, preparing: FiPackage, out_for_delivery: FiTruck, delivered: FiHome };

/** Horizontal progress rail; collapses to a vertical list on small screens. */
const OrderTimeline = ({ order }) => {
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
          <FiXCircle />
        </span>
        <div>
          <p className="font-semibold text-red-800">This order was cancelled</p>
          <p className="text-sm text-red-600">
            {order.cancelledAt ? formatDateTime(order.cancelledAt) : 'Any payment made has been released.'}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <ol className="flex flex-col gap-5 sm:flex-row sm:gap-0">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const meta = ORDER_STATUS_META[step];
        const Icon = STEP_ICONS[step];
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const history = order.statusHistory?.find((entry) => entry.status === step);

        return (
          <li key={step} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            <div className="flex items-center sm:w-full sm:flex-row">
              <span className="hidden h-0.5 flex-1 sm:block" style={{ background: index === 0 ? 'transparent' : isDone ? '#10b981' : '#E7D3BB' }} />
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-500',
                  isDone ? 'bg-emerald-500 text-white' : 'bg-cream-300 text-cocoa-300',
                  isCurrent && 'ring-4 ring-emerald-100',
                )}
              >
                <Icon />
              </span>
              <span
                className="hidden h-0.5 flex-1 sm:block"
                style={{ background: index === ORDER_STATUS_FLOW.length - 1 ? 'transparent' : index < currentIndex ? '#10b981' : '#E7D3BB' }}
              />
            </div>

            <div className="sm:mt-2.5">
              <p className={cn('text-sm font-semibold', isDone ? 'text-cocoa-800' : 'text-cocoa-300')}>{meta.label}</p>
              {history && <p className="text-xs text-cocoa-300">{formatDate(history.changedAt)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    orderService
      .getOne(id)
      .then((response) => setOrder(response.data.order))
      .catch((error) => {
        toast.error(error.message);
        navigate('/account/orders', { replace: true });
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const cancelOrder = async () => {
    setIsCancelling(true);
    try {
      const response = await orderService.cancel(id, 'Cancelled from my account');
      setOrder(response.data.order);
      toast.success(response.message);
      setConfirmCancel(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!order) return null;

  const statusMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
  const paymentMeta = PAYMENT_STATUS_META[order.payment.status] || PAYMENT_STATUS_META.pending;
  const methodMeta = PAYMENT_METHOD_META[order.payment.method] || PAYMENT_METHOD_META.card;

  const canCancel = ['pending', 'confirmed'].includes(order.status) && order.payment.status !== 'paid';
  const needsPayment = order.payment.status === 'pending' && order.payment.method !== 'cash_on_delivery' && order.status !== 'cancelled';

  return (
    <>
      <Seo title={`Order ${order.orderNumber}`} noIndex />

      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-400 hover:text-cocoa-800">
        <FiArrowLeft /> All orders
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-cocoa-800">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-cocoa-400">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={paymentMeta.tone}>Payment: {paymentMeta.label}</Badge>
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        </div>
      </header>

      {needsPayment && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div>
            <p className="font-semibold text-amber-900">This order is waiting for payment</p>
            <p className="text-sm text-amber-700">Complete it to secure your items — nothing has been charged yet.</p>
          </div>
          <Button to={`/payment/${order._id}`} icon={FiCreditCard} size="sm">
            Pay now
          </Button>
        </div>
      )}

      <section className="card mt-6 p-6">
        <h2 className="mb-6 font-display text-lg text-cocoa-800">Order progress</h2>
        <OrderTimeline order={order} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card p-6">
          <h2 className="font-display text-lg text-cocoa-800">Items</h2>

          <ul className="mt-5 divide-y divide-cream-300">
            {order.items.map((item, index) => (
              <li key={index} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <Link to={`/products/${item.slug}`} className="shrink-0">
                  <SmartImage src={item.image} alt={item.name} width={160} className="h-20 w-20 rounded-xl" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.slug}`} className="font-medium text-cocoa-800 transition-colors hover:text-caramel-700">
                    {item.name}
                  </Link>
                  {item.variant?.name && <p className="text-xs text-cocoa-300">{item.variant.name}</p>}
                  <p className="mt-1 text-sm text-cocoa-400">
                    {formatPrice(item.unitPrice, currency)} × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-cocoa-800">{formatPrice(item.lineTotal, currency)}</span>
              </li>
            ))}
          </ul>

          {order.customerNotes && (
            <div className="mt-6 rounded-xl bg-cream-200/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-cocoa-400">Your notes</p>
              <p className="mt-1 text-sm text-cocoa-500">{order.customerNotes}</p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-lg text-cocoa-800">Payment summary</h2>

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-cocoa-400">Subtotal</dt>
                <dd className="font-semibold text-cocoa-800">{formatPrice(order.pricing.subtotal, currency)}</dd>
              </div>

              {order.pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount{order.coupon?.code ? ` (${order.coupon.code})` : ''}</dt>
                  <dd className="font-semibold">-{formatPrice(order.pricing.discount, currency)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-cocoa-400">Delivery ({order.deliveryZone?.name})</dt>
                <dd className="font-semibold text-cocoa-800">
                  {order.pricing.deliveryFee === 0 ? 'Free' : formatPrice(order.pricing.deliveryFee, currency)}
                </dd>
              </div>

              {order.pricing.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-cocoa-400">Tax</dt>
                  <dd className="font-semibold text-cocoa-800">{formatPrice(order.pricing.tax, currency)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-cream-300 pt-5">
              <span className="font-display text-base text-cocoa-800">Total</span>
              <span className="font-display text-xl font-semibold text-cocoa-800">
                {formatPrice(order.pricing.total, currency)}
              </span>
            </div>

            <div className="mt-5 rounded-xl bg-cream-200/70 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-cocoa-700">
                <FiCreditCard className="text-caramel-600" /> {methodMeta.label}
              </p>
              <p className="mt-1 text-xs text-cocoa-400">
                {order.payment.paidAt
                  ? `Paid on ${formatDateTime(order.payment.paidAt)}`
                  : order.payment.status === 'failed'
                    ? order.payment.failureReason || 'The payment was not completed.'
                    : 'Payment pending'}
              </p>
              {order.payment.transactionId && (
                <p className="mt-1 text-xs text-cocoa-300">Ref: {order.payment.transactionId}</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiMapPin className="text-caramel-600" /> Delivery address
            </h2>

            <address className="mt-4 space-y-0.5 text-sm not-italic leading-relaxed text-cocoa-500">
              <p className="font-semibold text-cocoa-800">{order.contact.fullName}</p>
              <p>{order.contact.phone}</p>
              <p>{order.contact.email}</p>
              <p className="pt-2">
                {[
                  order.shippingAddress.street,
                  order.shippingAddress.building && `Building ${order.shippingAddress.building}`,
                  order.shippingAddress.floor && `Floor ${order.shippingAddress.floor}`,
                  order.shippingAddress.apartment && `Apt ${order.shippingAddress.apartment}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>
                {[order.shippingAddress.district, order.shippingAddress.city, order.shippingAddress.governorate]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </address>

            {order.deliveryZone?.estimatedTime && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-cream-200 px-3 py-2 text-xs text-cocoa-500">
                <FiTruck className="text-caramel-600" /> {order.deliveryZone.estimatedTime}
              </p>
            )}
          </div>

          {canCancel && (
            <Button variant="outline" fullWidth onClick={() => setConfirmCancel(true)}>
              Cancel this order
            </Button>
          )}

          {order.status === 'delivered' && (
            <Button to="/account/reviews" variant="outline" fullWidth>
              Review what you received
            </Button>
          )}
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelOrder}
        isLoading={isCancelling}
        title="Cancel this order?"
        message="We will release the items back to the shop and any coupon you used. This cannot be undone."
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep my order"
      />
    </>
  );
};

export default OrderDetails;
