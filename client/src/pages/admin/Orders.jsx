import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSearch, FiEye, FiCalendar } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { adminOrderService, adminZoneService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../utils/constants.js';
import useDebounce from '../../hooks/useDebounce.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total-desc', label: 'Highest value' },
  { value: 'total-asc', label: 'Lowest value' },
];

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currency } = useSettings();

  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: searchParams.get('status') || 'all',
    paymentStatus: 'all',
    zone: '',
    from: '',
    to: '',
    sort: 'newest',
    page: 1,
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => {
    adminZoneService
      .list()
      .then((response) => setZones(response.data.zones))
      .catch(() => setZones([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = { ...filters, search: debouncedSearch, limit: 15 };
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === 'all') delete params[key];
    });

    adminOrderService
      .list(params)
      .then((response) => {
        setOrders(response.data.orders);
        setMeta(response.meta);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, filters.status, filters.paymentStatus, filters.zone, filters.from, filters.to, filters.sort, filters.page]);

  const setFilter = (changes) => setFilters((current) => ({ ...current, ...changes, page: changes.page ?? 1 }));

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (order) => (
        <div>
          <p className="font-semibold text-cocoa-800">{order.orderNumber}</p>
          <p className="text-xs text-cocoa-300">{order.items?.length} item{order.items?.length === 1 ? '' : 's'}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-cocoa-700">{order.contact?.fullName}</p>
          <p className="truncate text-xs text-cocoa-300">{order.contact?.phone}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      hideOnMobile: true,
      render: (order) => <span className="text-cocoa-500">{formatDate(order.createdAt)}</span>,
    },
    {
      key: 'zone',
      header: 'Area',
      hideOnMobile: true,
      render: (order) => <span className="text-cocoa-500">{order.deliveryZone?.name}</span>,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (order) => {
        const meta = PAYMENT_STATUS_META[order.payment?.status] || PAYMENT_STATUS_META.pending;
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => {
        const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (order) => (
        <span className="font-semibold text-cocoa-800">{formatPrice(order.pricing?.total, currency)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (order) => (
        <Button to={`/admin/orders/${order._id}`} variant="ghost" size="sm" icon={FiEye}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Orders" description={`${meta.total} order${meta.total === 1 ? '' : 's'} found.`} />

      <div className="card mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-300" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilter({ search: event.target.value })}
              placeholder="Order number, name, phone"
              aria-label="Search orders"
              className="input py-2.5 pl-10 text-sm"
            />
          </div>

          <Select
            value={filters.status}
            onChange={(event) => setFilter({ status: event.target.value })}
            options={STATUS_OPTIONS}
            className="py-2.5 text-sm"
            aria-label="Filter by order status"
          />

          <Select
            value={filters.paymentStatus}
            onChange={(event) => setFilter({ paymentStatus: event.target.value })}
            options={PAYMENT_OPTIONS}
            className="py-2.5 text-sm"
            aria-label="Filter by payment status"
          />

          <Select
            value={filters.zone}
            onChange={(event) => setFilter({ zone: event.target.value })}
            className="py-2.5 text-sm"
            aria-label="Filter by delivery area"
          >
            <option value="">All areas</option>
            {zones.map((zone) => (
              <option key={zone._id} value={zone._id}>
                {zone.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="from-date" className="mb-1 block text-xs font-semibold text-cocoa-400">
                From
              </label>
              <input
                id="from-date"
                type="date"
                value={filters.from}
                onChange={(event) => setFilter({ from: event.target.value })}
                className="input py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="to-date" className="mb-1 block text-xs font-semibold text-cocoa-400">
                To
              </label>
              <input
                id="to-date"
                type="date"
                value={filters.to}
                onChange={(event) => setFilter({ to: event.target.value })}
                className="input py-2 text-sm"
              />
            </div>
            {(filters.from || filters.to) && (
              <button
                type="button"
                onClick={() => setFilter({ from: '', to: '' })}
                className="pb-2.5 text-xs font-semibold text-caramel-700 hover:underline"
              >
                Clear dates
              </button>
            )}
          </div>

          <Select
            value={filters.sort}
            onChange={(event) => setFilter({ sort: event.target.value })}
            options={SORT_OPTIONS}
            className="ml-auto w-auto py-2 text-xs"
            aria-label="Sort orders"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        isLoading={isLoading}
        onRowClick={(order) => navigate(`/admin/orders/${order._id}`)}
        emptyTitle="No orders match those filters"
        emptyMessage="Try widening the date range or clearing a filter."
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-8"
      />
    </div>
  );
};

export default Orders;
