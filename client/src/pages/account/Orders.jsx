import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { orderService } from '../../services/commerceService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../utils/constants.js';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Orders = () => {
  const { currency } = useSettings();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    orderService
      .mine({ status, page, limit: 8 })
      .then((response) => {
        if (cancelled) return;
        setOrders(response.data.orders);
        setMeta(response.meta);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-cocoa-800">My orders</h1>
        <p className="mt-1 text-sm text-cocoa-400">Track what is on the way and revisit what you have ordered before.</p>
      </div>

      <Tabs
        tabs={TABS}
        active={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-card" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiPackage}
            title={status === 'all' ? 'No orders yet' : 'Nothing in this status'}
            message={
              status === 'all'
                ? 'When you place your first order it will appear here, with live tracking.'
                : 'Try another tab to see your other orders.'
            }
            actionLabel={status === 'all' ? 'Start shopping' : undefined}
            actionTo="/products"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
            const paymentMeta = PAYMENT_STATUS_META[order.payment.status] || PAYMENT_STATUS_META.pending;

            return (
              <article key={order._id} className="card overflow-hidden transition-shadow duration-300 hover:shadow-lift">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-300 bg-cream-100/60 px-5 py-3.5">
                  <div>
                    <p className="font-display text-base font-semibold text-cocoa-800">{order.orderNumber}</p>
                    <p className="text-xs text-cocoa-300">Placed {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={paymentMeta.tone}>{paymentMeta.label}</Badge>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </div>
                </header>

                <div className="flex flex-wrap items-center gap-5 p-5">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 4).map((item, index) => (
                      <SmartImage
                        key={index}
                        src={item.image}
                        alt={item.name}
                        width={120}
                        className="h-14 w-14 rounded-xl border-2 border-cream-50"
                      />
                    ))}
                    {order.items.length > 4 && (
                      <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-cream-50 bg-cream-300 text-xs font-bold text-cocoa-500">
                        +{order.items.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-cocoa-500">
                      {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-cocoa-300">
                      {order.deliveryZone?.name} · {order.itemsCount ?? order.items.length} item
                      {(order.itemsCount ?? order.items.length) === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-cocoa-300">Total</p>
                      <p className="font-display text-lg font-semibold text-cocoa-800">
                        {formatPrice(order.pricing.total, currency)}
                      </p>
                    </div>
                    <Button to={`/account/orders/${order._id}`} variant="outline" size="sm" iconRight={FiChevronRight}>
                      Details
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}

          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} className="pt-6" />
        </div>
      )}
    </div>
  );
};

export default Orders;
