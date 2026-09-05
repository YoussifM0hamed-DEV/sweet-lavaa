import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSearch, FiUserCheck, FiUserX, FiEye } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { adminCustomerService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDate, initials } from '../../utils/format.js';
import useDebounce from '../../hooks/useDebounce.js';

const Customers = () => {
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [toggleTarget, setToggleTarget] = useState(null);

  const debouncedSearch = useDebounce(filters.search, 400);

  const load = () => {
    setIsLoading(true);
    adminCustomerService
      .list({ search: debouncedSearch, status: filters.status, page: filters.page, limit: 15 })
      .then((response) => {
        setCustomers(response.data.customers);
        setMeta(response.meta);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [debouncedSearch, filters.status, filters.page]);

  const toggleStatus = async () => {
    try {
      const response = await adminCustomerService.toggleStatus(toggleTarget._id);
      toast.success(response.message);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setToggleTarget(null);
    }
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (customer) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 text-xs font-bold text-cream-100">
            {customer.avatar?.url ? (
              <img src={customer.avatar.url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(customer.fullName)
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-cocoa-800">{customer.fullName}</p>
            <p className="truncate text-xs text-cocoa-300">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      hideOnMobile: true,
      render: (customer) => <span className="text-cocoa-500">{customer.phone || '—'}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      hideOnMobile: true,
      render: (customer) => <span className="text-cocoa-500">{formatDate(customer.createdAt)}</span>,
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'center',
      render: (customer) => <span className="font-semibold text-cocoa-700">{customer.ordersCount}</span>,
    },
    {
      key: 'spent',
      header: 'Total spent',
      align: 'right',
      render: (customer) => (
        <span className="font-semibold text-cocoa-800">{formatPrice(customer.totalSpent, currency)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer) => (
        <Badge tone={customer.isActive ? 'success' : 'danger'}>{customer.isActive ? 'Active' : 'Disabled'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (customer) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setToggleTarget(customer);
            }}
            aria-label={customer.isActive ? 'Disable account' : 'Enable account'}
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            {customer.isActive ? <FiUserX className="text-sm" /> : <FiUserCheck className="text-sm" />}
          </button>
          <Button to={`/admin/customers/${customer._id}`} variant="ghost" size="sm" icon={FiEye}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Customers" description={`${meta.total} registered customer${meta.total === 1 ? '' : 's'}.`} />

      <div className="card mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-300" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((c) => ({ ...c, search: event.target.value, page: 1 }))}
              placeholder="Search by name, email or phone"
              aria-label="Search customers"
              className="input py-2.5 pl-10 text-sm"
            />
          </div>

          <Select
            value={filters.status}
            onChange={(event) => setFilters((c) => ({ ...c, status: event.target.value, page: 1 }))}
            className="py-2.5 text-sm"
            aria-label="Filter by status"
            options={[
              { value: '', label: 'All customers' },
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={customers}
        isLoading={isLoading}
        onRowClick={(customer) => navigate(`/admin/customers/${customer._id}`)}
        emptyTitle="No customers found"
        emptyMessage="Try a different search term."
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-8"
      />

      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={toggleStatus}
        tone={toggleTarget?.isActive ? 'danger' : 'warning'}
        title={toggleTarget?.isActive ? 'Disable this account?' : 'Enable this account?'}
        message={
          toggleTarget?.isActive
            ? `${toggleTarget?.fullName} will be signed out immediately and will not be able to sign in or order.`
            : `${toggleTarget?.fullName} will be able to sign in and order again.`
        }
        confirmLabel={toggleTarget?.isActive ? 'Disable account' : 'Enable account'}
      />
    </div>
  );
};

export default Customers;
