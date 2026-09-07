import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiUser, FiMapPin, FiCreditCard, FiPackage, FiSave, FiPrinter, FiClock,
} from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select, Textarea } from '../../components/ui/Input.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminOrderService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDateTime } from '../../utils/format.js';
import { ORDER_STATUS_META, PAYMENT_STATUS_META, PAYMENT_METHOD_META } from '../../utils/constants.js';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const InfoCard = ({ icon: Icon, title, children }) => (
  <section className="card p-5">
    <h2 className="flex items-center gap-2 font-display text-base text-cocoa-800">
      <Icon className="text-caramel-600" /> {title}
    </h2>
    <div className="mt-4">{children}</div>
  </section>
);

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [note, setNote] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = () => {
    adminOrderService
      .getOne(id)
      .then((response) => {
        const loaded = response.data.order;
        setOrder(loaded);
        setStatus(loaded.status);
        setPaymentStatus(loaded.payment.status);
        setAdminNote(loaded.adminNotes || '');
      })
      .catch((error) => {
        toast.error(error.message);
        navigate('/admin/orders', { replace: true });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [id]);

  const applyStatus = async (nextStatus) => {
    setIsSaving(true);
    try {
      const response = await adminOrderService.updateStatus(id, { status: nextStatus, note });
      setOrder(response.data.order);
      setStatus(response.data.order.status);
      setNote('');
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message);
      setStatus(order.status);
    } finally {
      setIsSaving(false);
      setConfirmCancel(false);
    }
  };

  const saveStatus = () => {
    if (status === order.status) {
      toast.error('The order already has this status.');
      return;
    }
    // Cancelling returns stock and coupon usage, so make it deliberate.
    if (status === 'cancelled') {
      setConfirmCancel(true);
      return;
    }
    applyStatus(status);
  };

  const savePayment = async () => {
    setIsSaving(true);
    try {
      const response = await adminOrderService.updatePayment(id, { paymentStatus, note });
      setOrder(response.data.order);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNote = async () => {
    setIsSaving(true);
    try {
      await adminOrderService.addNote(id, adminNote);
      toast.success('Note saved.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="h-96 rounded-card" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
  const paymentMeta = PAYMENT_STATUS_META[order.payment.status] || PAYMENT_STATUS_META.pending;
  const methodMeta = PAYMENT_METHOD_META[order.payment.method] || PAYMENT_METHOD_META.card;

  return (
    <div>
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-400 hover:text-cocoa-800">
        <FiArrowLeft /> All orders
      </Link>

      <AdminPageHeader title={order.orderNumber} description={`Placed ${formatDateTime(order.createdAt)}`}>
        <Badge tone={paymentMeta.tone}>Payment: {paymentMeta.label}</Badge>
        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        <Button variant="ghost" size="sm" icon={FiPrinter} onClick={() => window.print()}>
          Print
        </Button>
      </AdminPageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base text-cocoa-800">
              <FiPackage className="text-caramel-600" /> Items ({order.items.length})
            </h2>

            <ul className="mt-4 divide-y divide-cream-300">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <SmartImage src={item.image} alt={item.name} width={120} className="h-14 w-14 shrink-0 rounded-lg" />

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-medium text-cocoa-800 hover:text-caramel-700"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-cocoa-300">
                      {item.categoryName}
                      {item.variant?.name ? ` · ${item.variant.name}` : ''}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm text-cocoa-500">
                      {formatPrice(item.unitPrice, currency)} × {item.quantity}
                    </p>
                    <p className="font-semibold text-cocoa-800">{formatPrice(item.lineTotal, currency)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-cream-300 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-cocoa-400">Subtotal</dt>
                <dd className="font-semibold text-cocoa-800">{formatPrice(order.pricing.subtotal, currency)}</dd>
              </div>
              {order.pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount {order.coupon?.code ? `(${order.coupon.code})` : ''}</dt>
                  <dd className="font-semibold">-{formatPrice(order.pricing.discount, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-cocoa-400">Delivery ({order.deliveryZone.name})</dt>
                <dd className="font-semibold text-cocoa-800">{formatPrice(order.pricing.deliveryFee, currency)}</dd>
              </div>
              {order.pricing.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-cocoa-400">Tax</dt>
                  <dd className="font-semibold text-cocoa-800">{formatPrice(order.pricing.tax, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-cream-300 pt-2.5 text-base">
                <dt className="font-display font-semibold text-cocoa-800">Total</dt>
                <dd className="font-display font-semibold text-cocoa-800">
                  {formatPrice(order.pricing.total, currency)}
                </dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <InfoCard icon={FiUser} title="Customer">
              <p className="font-semibold text-cocoa-800">{order.contact.fullName}</p>
              <p className="text-sm text-cocoa-500">{order.contact.email}</p>
              <p className="text-sm text-cocoa-500">{order.contact.phone}</p>

              {order.user && (
                <Link
                  to={`/admin/customers/${order.user._id || order.user}`}
                  className="mt-3 inline-block text-xs font-semibold text-caramel-700 hover:underline"
                >
                  View customer profile
                </Link>
              )}
            </InfoCard>

            <InfoCard icon={FiMapPin} title="Delivery address">
              <address className="space-y-0.5 text-sm not-italic leading-relaxed text-cocoa-500">
                <p>
                  {[
                    order.shippingAddress.street,
                    order.shippingAddress.building && `Bldg ${order.shippingAddress.building}`,
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
                <p className="pt-1.5 font-semibold text-cocoa-700">
                  {order.deliveryZone.name} · {order.deliveryZone.estimatedTime}
                </p>
              </address>

              {order.customerNotes && (
                <div className="mt-3 rounded-lg bg-cream-200/70 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-cocoa-400">Customer notes</p>
                  <p className="mt-1 text-sm text-cocoa-500">{order.customerNotes}</p>
                </div>
              )}
            </InfoCard>
          </div>

          <InfoCard icon={FiClock} title="Status history">
            <ol className="space-y-3">
              {[...(order.statusHistory || [])].reverse().map((entry, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-caramel-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-cocoa-700">
                      {ORDER_STATUS_META[entry.status]?.label || entry.status}
                    </p>
                    <p className="text-xs text-cocoa-300">
                      {formatDateTime(entry.changedAt)}
                      {entry.changedBy?.firstName ? ` · ${entry.changedBy.firstName} ${entry.changedBy.lastName}` : ''}
                    </p>
                    {entry.note && <p className="mt-0.5 text-xs text-cocoa-400">{entry.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </InfoCard>
        </div>

        {/* Management sidebar */}
        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-base text-cocoa-800">Order status</h2>

            <div className="mt-4 space-y-3">
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={STATUS_OPTIONS}
                aria-label="Order status"
                disabled={order.status === 'delivered'}
              />

              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note for the history log"
                rows={2}
              />

              <Button
                fullWidth
                size="sm"
                icon={FiSave}
                onClick={saveStatus}
                isLoading={isSaving}
                disabled={order.status === 'delivered'}
              >
                Update status
              </Button>

              {order.status === 'delivered' && (
                <p className="text-xs text-cocoa-300">A delivered order can no longer change status.</p>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base text-cocoa-800">
              <FiCreditCard className="text-caramel-600" /> Payment
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-cream-200/70 p-3 text-sm">
                <p className="font-semibold text-cocoa-700">{methodMeta.label}</p>
                <p className="mt-0.5 text-xs text-cocoa-400">
                  {order.payment.paidAt ? `Paid ${formatDateTime(order.payment.paidAt)}` : 'Not paid yet'}
                </p>
                {order.payment.transactionId && (
                  <p className="mt-0.5 text-xs text-cocoa-300">Ref: {order.payment.transactionId}</p>
                )}
                {order.payment.failureReason && (
                  <p className="mt-1 text-xs text-red-600">{order.payment.failureReason}</p>
                )}
              </div>

              <Select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                options={PAYMENT_OPTIONS}
                aria-label="Payment status"
              />

              <Button fullWidth size="sm" variant="outline" onClick={savePayment} isLoading={isSaving}>
                Update payment status
              </Button>

              <p className="text-xs leading-relaxed text-cocoa-300">
                Orders are cash on delivery, so mark them paid once the courier has collected. Older card
                orders were settled by the retired online provider.
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-base text-cocoa-800">Internal notes</h2>
            <p className="mt-1 text-xs text-cocoa-300">Only staff can see these.</p>

            <Textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="Anything the team should know about this order."
              rows={4}
              className="mt-3"
            />

            <Button fullWidth size="sm" variant="outline" className="mt-3" onClick={saveNote} isLoading={isSaving}>
              Save note
            </Button>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => {
          setConfirmCancel(false);
          setStatus(order.status);
        }}
        onConfirm={() => applyStatus('cancelled')}
        isLoading={isSaving}
        title="Cancel this order?"
        message="Stock will be returned to the catalogue and any coupon usage released. This cannot be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
      />
    </div>
  );
};

export default OrderDetails;
