import { useEffect, useState } from 'react';
import { FiUsers, FiRepeat, FiDollarSign, FiShoppingBag } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import { SalesAreaChart, OrdersBarChart, CategoryPieChart, TopProductsBarChart } from '../../components/admin/Charts.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { Select } from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import { adminStatsService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatNumber } from '../../utils/format.js';

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
];

const Panel = ({ title, description, children, className = '' }) => (
  <section className={`card p-6 ${className}`}>
    <h2 className="font-display text-lg text-cocoa-800">{title}</h2>
    {description && <p className="mt-1 text-sm text-cocoa-400">{description}</p>}
    <div className="mt-5">{children}</div>
  </section>
);

const Analytics = () => {
  const { currency } = useSettings();

  const [range, setRange] = useState('30');
  const [series, setSeries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [customers, setCustomers] = useState(null);
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminStatsService.overview(),
      adminStatsService.topProducts(8),
      adminStatsService.revenueByCategory(),
      adminStatsService.zones(),
      adminStatsService.customers(),
    ])
      .then(([overviewResult, productsResult, categoriesResult, zonesResult, customersResult]) => {
        if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value.data);
        if (productsResult.status === 'fulfilled') setTopProducts(productsResult.value.data.products);
        if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value.data.categories);
        if (zonesResult.status === 'fulfilled') setZones(zonesResult.value.data.zones);
        if (customersResult.status === 'fulfilled') setCustomers(customersResult.value.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    adminStatsService
      .sales(Number(range))
      .then((response) => setSeries(response.data.series))
      .catch(() => setSeries([]));
  }, [range]);

  const zoneColumns = [
    { key: 'name', header: 'Area', render: (zone) => <span className="font-semibold text-cocoa-800">{zone.name}</span> },
    { key: 'orders', header: 'Orders', align: 'center', render: (zone) => formatNumber(zone.orders) },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (zone) => <span className="font-semibold text-cocoa-800">{formatPrice(zone.revenue, currency)}</span>,
    },
    {
      key: 'averageOrder',
      header: 'Avg. order',
      align: 'right',
      render: (zone) => formatPrice(zone.averageOrder, currency),
    },
    {
      key: 'deliveryFees',
      header: 'Delivery fees',
      align: 'right',
      hideOnMobile: true,
      render: (zone) => formatPrice(zone.deliveryFees, currency),
    },
  ];

  const customerColumns = [
    { key: 'name', header: 'Customer', render: (row) => <span className="font-semibold text-cocoa-800">{row.name}</span> },
    { key: 'orders', header: 'Orders', align: 'center', render: (row) => formatNumber(row.orders) },
    {
      key: 'spent',
      header: 'Lifetime value',
      align: 'right',
      render: (row) => <span className="font-semibold text-cocoa-800">{formatPrice(row.spent, currency)}</span>,
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Analytics" description="Where the revenue comes from, and who keeps coming back.">
        <Select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          options={RANGE_OPTIONS}
          className="w-auto py-2 text-sm"
          aria-label="Chart range"
        />
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          isLoading={isLoading}
          icon={FiDollarSign}
          tone="emerald"
          label="Lifetime revenue"
          value={formatPrice(overview?.revenue.total ?? 0, currency)}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiShoppingBag}
          tone="caramel"
          label="Average order value"
          value={formatPrice(overview?.revenue.averageOrderValue ?? 0, currency)}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiUsers}
          tone="sky"
          label="Paying customers"
          value={formatNumber(customers?.buyers ?? 0)}
          hint={`of ${formatNumber(overview?.customers.total ?? 0)} registered`}
        />
        <StatCard
          isLoading={isLoading}
          icon={FiRepeat}
          tone="blush"
          label="Repeat purchase rate"
          value={`${customers?.repeatRate ?? 0}%`}
          hint={`${formatNumber(customers?.repeatBuyers ?? 0)} ordered more than once`}
        />
      </div>

      <div className="mt-6 grid gap-6">
        <Panel title="Revenue over time" description="Only paid orders count towards revenue.">
          {series.length ? <SalesAreaChart data={series} currency={currency} /> : <Skeleton className="h-[300px]" />}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Orders per day" description="Every order, paid or not.">
            {series.length ? <OrdersBarChart data={series} /> : <Skeleton className="h-[260px]" />}
          </Panel>

          <Panel title="Revenue by category">
            {categories.length ? (
              <CategoryPieChart data={categories.slice(0, 7)} currency={currency} />
            ) : (
              <p className="py-16 text-center text-sm text-cocoa-300">No paid orders yet.</p>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Best selling products" description="Ranked by revenue, not units.">
            {topProducts.length ? (
              <TopProductsBarChart data={topProducts} currency={currency} />
            ) : (
              <p className="py-16 text-center text-sm text-cocoa-300">No sales yet.</p>
            )}
          </Panel>

          <Panel title="Top products in detail">
            {topProducts.length === 0 ? (
              <p className="py-16 text-center text-sm text-cocoa-300">No sales yet.</p>
            ) : (
              <ul className="space-y-3">
                {topProducts.map((product, index) => (
                  <li key={product._id} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 font-display text-sm text-cocoa-300">{index + 1}</span>
                    <SmartImage src={product.image} alt={product.name} width={100} className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-cocoa-700">{product.name}</p>
                      <p className="text-xs text-cocoa-300">{product.unitsSold} units sold</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-cocoa-800">
                      {formatPrice(product.revenue, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-lg text-cocoa-800">Performance by delivery area</h2>
            <DataTable
              columns={zoneColumns}
              rows={zones}
              isLoading={isLoading}
              emptyTitle="No delivery data yet"
              emptyMessage="Zone performance appears once orders are paid."
            />
          </div>

          <div>
            <h2 className="mb-4 font-display text-lg text-cocoa-800">Top customers</h2>
            <DataTable
              columns={customerColumns}
              rows={customers?.topCustomers || []}
              isLoading={isLoading}
              rowKey={(row) => row._id}
              emptyTitle="No customer data yet"
              emptyMessage="This fills in as paid orders come through."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
