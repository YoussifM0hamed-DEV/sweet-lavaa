import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiDollarSign, FiShoppingCart, FiUsers, FiBox, FiClock, FiCheckCircle,
  FiAlertTriangle, FiArrowRight, FiStar, FiMail,
} from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import { SalesAreaChart, OrdersBarChart, CategoryPieChart } from '../../components/admin/Charts.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminStatsService, adminInventoryService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDate, formatNumber } from '../../utils/format.js';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../utils/constants.js';

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const Panel = ({ title, action, children, className = '' }) => (
  <section className={`card p-6 ${className}`}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-lg text-cocoa-800">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const Dashboard = () => {
  const { currency } = useSettings();

  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [range, setRange] = useState('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminStatsService.overview(),
      adminStatsService.revenueByCategory(),
      adminStatsService.recentOrders(6),
      adminInventoryService.alerts(),
    ])
      .then(([overviewResult, categoriesResult, ordersResult, alertsResult]) => {
        if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value.data);
        if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value.data.categories);
        if (ordersResult.status === 'fulfilled') setRecentOrders(ordersResult.value.data.orders);
        if (alertsResult.status === 'fulfilled') setAlerts(alertsResult.value.data.products);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    adminStatsService
      .sales(Number(range))
      .then((response) => setSeries(response.data.series))
      .catch(() => setSeries([]));
  }, [range]);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="How the shop is doing right now."
      >
        <Button to="/admin/products/new" size="sm">
          Add product
        </Button>
      </AdminPageHeader>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          isLoading={isLoading}
          icon={FiDollarSign}
          tone="emerald"
          label="Revenue this month"
          value={formatPrice(overview?.revenue.thisMonth ?? 0, currency)}
          change={overview?.revenue.change}
          hint={`${formatPrice(overview?.revenue.total ?? 0, currency)} all time`}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiShoppingCart}
          tone="caramel"
          label="Orders this month"
          value={formatNumber(overview?.orders.thisMonth ?? 0)}
          change={overview?.orders.change}
          hint={`${formatNumber(overview?.orders.total ?? 0)} total orders`}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiUsers}
          tone="sky"
          label="Customers"
          value={formatNumber(overview?.customers.total ?? 0)}
          hint={`${overview?.customers.thisMonth ?? 0} joined this month`}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiBox}
          tone="blush"
          label="Products"
          value={formatNumber(overview?.catalogue.products ?? 0)}
          hint={`${overview?.catalogue.categories ?? 0} categories`}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          isLoading={isLoading}
          icon={FiClock}
          tone="amber"
          label="Pending orders"
          value={formatNumber(overview?.orders.pending ?? 0)}
          hint="Waiting to be confirmed"
        />
        <StatCard
          isLoading={isLoading}
          icon={FiCheckCircle}
          tone="emerald"
          label="Delivered"
          value={formatNumber(overview?.orders.delivered ?? 0)}
          hint={`${overview?.orders.cancelled ?? 0} cancelled`}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiDollarSign}
          tone="cocoa"
          label="Today"
          value={formatPrice(overview?.today.revenue ?? 0, currency)}
          hint={`${overview?.today.orders ?? 0} order${overview?.today.orders === 1 ? '' : 's'} today`}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiAlertTriangle}
          tone="amber"
          label="Needs attention"
          value={formatNumber(
            (overview?.attention.lowStock ?? 0) + (overview?.attention.outOfStock ?? 0),
          )}
          hint={`${overview?.attention.outOfStock ?? 0} out of stock, ${overview?.attention.lowStock ?? 0} low`}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Revenue over time"
          action={
            <Select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              options={RANGE_OPTIONS}
              className="w-auto py-2 text-xs"
              aria-label="Chart range"
            />
          }
        >
          {series.length ? <SalesAreaChart data={series} currency={currency} /> : <Skeleton className="h-[300px]" />}
        </Panel>

        <Panel title="Revenue by category">
          {categories.length ? (
            <CategoryPieChart data={categories.slice(0, 6)} currency={currency} />
          ) : (
            <p className="py-16 text-center text-sm text-cocoa-300">No paid orders yet.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Orders per day">
          {series.length ? <OrdersBarChart data={series} /> : <Skeleton className="h-[260px]" />}
        </Panel>

        <Panel
          title="Low stock"
          action={
            <Link to="/admin/inventory" className="text-xs font-semibold text-caramel-700 hover:underline">
              Manage inventory
            </Link>
          }
        >
          {alerts.length === 0 ? (
            <p className="py-10 text-center text-sm text-cocoa-300">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.slice(0, 6).map((product) => (
                <li key={product._id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm text-cocoa-600">{product.name}</span>
                  <Badge tone={product.stock <= 0 ? 'danger' : 'warning'}>
                    {product.stock <= 0 ? 'Out of stock' : `${product.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Recent orders */}
      <Panel
        className="mt-6"
        title="Recent orders"
        action={
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-caramel-700 hover:underline"
          >
            View all orders <FiArrowRight />
          </Link>
        }
      >
        {recentOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-cocoa-300">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-300 text-left text-xs uppercase tracking-wider text-cocoa-300">
                  <th scope="col" className="pb-3 pr-4 font-bold">Order</th>
                  <th scope="col" className="pb-3 pr-4 font-bold">Customer</th>
                  <th scope="col" className="hidden pb-3 pr-4 font-bold sm:table-cell">Area</th>
                  <th scope="col" className="hidden pb-3 pr-4 font-bold md:table-cell">Date</th>
                  <th scope="col" className="pb-3 pr-4 font-bold">Status</th>
                  <th scope="col" className="pb-3 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {recentOrders.map((order) => {
                  const statusMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
                  const paymentMeta = PAYMENT_STATUS_META[order.payment?.status] || PAYMENT_STATUS_META.pending;

                  return (
                    <tr key={order._id} className="transition-colors hover:bg-cream-100/60">
                      <td className="py-3.5 pr-4">
                        <Link to={`/admin/orders/${order._id}`} className="font-semibold text-cocoa-800 hover:text-caramel-700">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 pr-4 text-cocoa-500">{order.contact?.fullName}</td>
                      <td className="hidden py-3.5 pr-4 text-cocoa-400 sm:table-cell">{order.deliveryZone?.name}</td>
                      <td className="hidden py-3.5 pr-4 text-cocoa-400 md:table-cell">{formatDate(order.createdAt)}</td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                          <Badge tone={paymentMeta.tone}>{paymentMeta.label}</Badge>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-cocoa-800">
                        {formatPrice(order.pricing?.total, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { to: '/admin/reviews', icon: FiStar, label: 'Reviews to moderate', value: overview?.attention.pendingReviews ?? 0 },
          { to: '/admin/orders?status=pending', icon: FiClock, label: 'Orders to confirm', value: overview?.orders.pending ?? 0 },
          { to: '/admin/customers', icon: FiMail, label: 'New messages', value: overview?.attention.newMessages ?? 0 },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-200 text-lg text-caramel-600">
              <item.icon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl font-semibold text-cocoa-800">{item.value}</span>
              <span className="block text-xs text-cocoa-400">{item.label}</span>
            </span>
            <FiArrowRight className="shrink-0 text-cocoa-300" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
