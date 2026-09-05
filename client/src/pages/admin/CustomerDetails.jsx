import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiUserX, FiUserCheck, FiShoppingBag } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminCustomerService, adminOrderService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDate, formatDateTime, initials } from '../../utils/format.js';
import { ORDER_STATUS_META, PAYMENT_STATUS_META, ROLE_META } from '../../utils/constants.js';
import { FiDollarSign, FiPackage, FiCalendar } from 'react-icons/fi';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const load = () => {
    Promise.allSettled([adminCustomerService.getOne(id), adminOrderService.forCustomer(id)])
      .then(([customerResult, ordersResult]) => {
        if (customerResult.status === 'fulfilled') {
          setCustomer(customerResult.value.data.customer);
        } else {
          toast.error(customerResult.reason?.message || 'Customer not found.');
          navigate('/admin/customers', { replace: true });
        }
        if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value.data.orders);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [id]);

  const toggleStatus = async () => {
    try {
      const response = await adminCustomerService.toggleStatus(id);
      toast.success(response.message);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setConfirmToggle(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (!customer) return null;

  const role = ROLE_META[customer.role] || ROLE_META.customer;

  const orderColumns = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (order) => (
        <Link to={`/admin/orders/${order._id}`} className="font-semibold text-cocoa-800 hover:text-caramel-700">
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (order) => <span className="text-cocoa-500">{formatDate(order.createdAt)}</span>,
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
  ];

  return (
    <div>
      <Link to="/admin/customers" className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-400 hover:text-cocoa-800">
        <FiArrowLeft /> All customers
      </Link>

      <AdminPageHeader title={customer.fullName} description={`Customer since ${formatDate(customer.createdAt)}`}>
        <Badge tone={customer.isActive ? 'success' : 'danger'}>{customer.isActive ? 'Active' : 'Disabled'}</Badge>
        <Badge tone={role.tone}>{role.label}</Badge>
        <Button
          variant={customer.isActive ? 'danger' : 'primary'}
          size="sm"
          icon={customer.isActive ? FiUserX : FiUserCheck}
          onClick={() => setConfirmToggle(true)}
        >
          {customer.isActive ? 'Disable account' : 'Enable account'}
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiShoppingBag} tone="caramel" label="Total orders" value={customer.ordersCount} />
        <StatCard
          icon={FiDollarSign}
          tone="emerald"
          label="Total spent"
          value={formatPrice(customer.totalSpent, currency)}
        />
        <StatCard
          icon={FiPackage}
          tone="sky"
          label="Average order"
          value={formatPrice(customer.ordersCount ? Math.round(customer.totalSpent / customer.ordersCount) : 0, currency)}
        />
        <StatCard
          icon={FiCalendar}
          tone="blush"
          label="Last order"
          value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : 'Never'}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 font-display text-lg font-semibold text-cream-100">
                {customer.avatar?.url ? (
                  <img src={customer.avatar.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(customer.fullName)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg text-cocoa-800">{customer.fullName}</p>
                <p className="text-xs text-cocoa-300">
                  Signs in with {customer.provider === 'google' ? 'Google' : 'email and password'}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-t border-cream-300 pt-5 text-sm">
              <div className="flex gap-3">
                <dt className="mt-0.5 shrink-0 text-caramel-600">
                  <FiMail />
                  <span className="sr-only">Email</span>
                </dt>
                <dd className="min-w-0 break-all text-cocoa-500">{customer.email}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="mt-0.5 shrink-0 text-caramel-600">
                  <FiPhone />
                  <span className="sr-only">Phone</span>
                </dt>
                <dd className="text-cocoa-500">{customer.phone || 'Not provided'}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base text-cocoa-800">
              <FiMapPin className="text-caramel-600" /> Saved addresses ({customer.addresses?.length || 0})
            </h2>

            {customer.addresses?.length ? (
              <ul className="mt-4 space-y-3">
                {customer.addresses.map((address) => (
                  <li key={address._id} className="rounded-xl bg-cream-200/60 p-3.5 text-sm">
                    <p className="flex items-center gap-2 font-semibold text-cocoa-700">
                      {address.label}
                      {address.isDefault && <Badge tone="success">Default</Badge>}
                    </p>
                    <p className="mt-1 leading-relaxed text-cocoa-400">
                      {[address.street, address.building, address.apartment].filter(Boolean).join(', ')}
                      <br />
                      {[address.district, address.city, address.governorate].filter(Boolean).join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-cocoa-300">No addresses saved.</p>
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-4 font-display text-lg text-cocoa-800">Order history</h2>
          <DataTable
            columns={orderColumns}
            rows={orders}
            onRowClick={(order) => navigate(`/admin/orders/${order._id}`)}
            emptyTitle="No orders yet"
            emptyMessage="This customer has not placed an order."
          />
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        onConfirm={toggleStatus}
        tone={customer.isActive ? 'danger' : 'warning'}
        title={customer.isActive ? 'Disable this account?' : 'Enable this account?'}
        message={
          customer.isActive
            ? 'They will be signed out immediately and will not be able to sign in or order.'
            : 'They will be able to sign in and order again.'
        }
        confirmLabel={customer.isActive ? 'Disable account' : 'Enable account'}
      />
    </div>
  );
};

export default CustomerDetails;
