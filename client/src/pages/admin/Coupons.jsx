import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiCopy, FiPercent } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { adminCouponService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';

const EMPTY = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  minOrderAmount: '', maxDiscountAmount: '', expiresAt: '', usageLimit: '', perUserLimit: 1, isActive: true,
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const Coupons = () => {
  const { currency } = useSettings();

  const [coupons, setCoupons] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', page: 1 });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setIsLoading(true);
    adminCouponService
      .list({ ...filters, limit: 15 })
      .then((response) => {
        setCoupons(response.data.coupons);
        setMeta(response.meta);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [filters.status, filters.page]);

  const save = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.code.trim().length < 3) found.code = 'Code must be at least 3 characters.';
    if (form.discountValue === '' || Number(form.discountValue) <= 0) found.discountValue = 'Enter a discount value.';
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) {
      found.discountValue = 'A percentage cannot exceed 100.';
    }
    if (!form.expiresAt) found.expiresAt = 'Choose an expiry date.';
    else if (new Date(form.expiresAt) <= new Date()) found.expiresAt = 'The expiry date must be in the future.';

    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
      expiresAt: new Date(form.expiresAt).toISOString(),
      usageLimit: Number(form.usageLimit) || 0,
      perUserLimit: Number(form.perUserLimit) || 0,
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      if (editing === 'new') await adminCouponService.create(payload);
      else await adminCouponService.update(editing, payload);

      toast.success(editing === 'new' ? 'Coupon created.' : 'Coupon updated.');
      setEditing(null);
      load();
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (coupon) => {
    try {
      const response = await adminCouponService.toggleStatus(coupon._id);
      toast.success(response.message);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async () => {
    try {
      await adminCouponService.remove(deleteTarget._id);
      toast.success('Coupon deleted.');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${code} copied.`);
    } catch {
      toast.error('Could not copy the code.');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (coupon) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-wider text-cocoa-800">{coupon.code}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              copyCode(coupon.code);
            }}
            aria-label={`Copy ${coupon.code}`}
            className="rounded-full p-1.5 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            <FiCopy className="text-xs" />
          </button>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (coupon) => (
        <div>
          <span className="font-semibold text-cocoa-800">
            {coupon.discountType === 'percentage'
              ? `${coupon.discountValue}%`
              : formatPrice(coupon.discountValue, currency)}
          </span>
          {coupon.maxDiscountAmount > 0 && (
            <span className="ml-1 text-xs text-cocoa-300">max {formatPrice(coupon.maxDiscountAmount, currency)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'minimum',
      header: 'Min. order',
      hideOnMobile: true,
      render: (coupon) => (
        <span className="text-cocoa-500">
          {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount, currency) : 'None'}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (coupon) => (
        <span className="text-cocoa-500">
          {coupon.usedCount}
          {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ' used'}
        </span>
      ),
    },
    {
      key: 'expires',
      header: 'Expires',
      render: (coupon) => (
        <span className={coupon.isExpired ? 'text-red-600' : 'text-cocoa-500'}>{formatDate(coupon.expiresAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (coupon) => {
        if (coupon.isExpired) return <Badge tone="danger">Expired</Badge>;
        if (coupon.isExhausted) return <Badge tone="warning">Limit reached</Badge>;
        return <Badge tone={coupon.isActive ? 'success' : 'neutral'}>{coupon.isActive ? 'Active' : 'Disabled'}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (coupon) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => toggleStatus(coupon)}
            aria-label={coupon.isActive ? 'Disable coupon' : 'Enable coupon'}
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            {coupon.isActive ? <FiToggleRight className="text-base text-emerald-500" /> : <FiToggleLeft className="text-base" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm({
                ...EMPTY,
                ...coupon,
                expiresAt: toDateInput(coupon.expiresAt),
                minOrderAmount: coupon.minOrderAmount || '',
                maxDiscountAmount: coupon.maxDiscountAmount || '',
                usageLimit: coupon.usageLimit || '',
              });
              setErrors({});
              setEditing(coupon._id);
            }}
            aria-label="Edit coupon"
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            <FiEdit2 className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(coupon)}
            aria-label="Delete coupon"
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <FiTrash2 className="text-sm" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Coupons" description={`${meta.total} coupon${meta.total === 1 ? '' : 's'} configured.`}>
        <Select
          value={filters.status}
          onChange={(event) => setFilters({ status: event.target.value, page: 1 })}
          className="w-auto py-2 text-sm"
          aria-label="Filter coupons"
          options={[
            { value: '', label: 'All coupons' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Disabled' },
            { value: 'expired', label: 'Expired' },
          ]}
        />
        <Button
          size="sm"
          icon={FiPlus}
          onClick={() => {
            setForm(EMPTY);
            setErrors({});
            setEditing('new');
          }}
        >
          Create coupon
        </Button>
      </AdminPageHeader>

      <DataTable
        columns={columns}
        rows={coupons}
        isLoading={isLoading}
        emptyTitle="No coupons yet"
        emptyMessage="Create a code to run your first promotion."
        emptyAction={{
          label: 'Create coupon',
          onClick: () => {
            setForm(EMPTY);
            setEditing('new');
          },
        }}
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-8"
      />

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Create a coupon' : 'Edit coupon'}
        size="lg"
      >
        <form onSubmit={save} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Coupon code"
              value={form.code}
              onChange={(event) => setForm((c) => ({ ...c, code: event.target.value.toUpperCase() }))}
              error={errors.code}
              placeholder="SWEET10"
              className="font-mono uppercase tracking-wider"
              required
            />
            <Select
              label="Discount type"
              value={form.discountType}
              onChange={(event) => setForm((c) => ({ ...c, discountType: event.target.value }))}
              options={[
                { value: 'percentage', label: 'Percentage off' },
                { value: 'fixed', label: 'Fixed amount off' },
              ]}
            />
          </div>

          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
            placeholder="Internal note about this promotion."
            rows={2}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={form.discountType === 'percentage' ? 'Discount (%)' : `Discount (${currency})`}
              type="number"
              min="0"
              value={form.discountValue}
              onChange={(event) => setForm((c) => ({ ...c, discountValue: event.target.value }))}
              error={errors.discountValue}
              required
            />
            <Input
              label={`Maximum discount (${currency})`}
              type="number"
              min="0"
              value={form.maxDiscountAmount}
              onChange={(event) => setForm((c) => ({ ...c, maxDiscountAmount: event.target.value }))}
              hint="Caps a percentage discount. 0 for no cap."
              disabled={form.discountType !== 'percentage'}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={`Minimum order (${currency})`}
              type="number"
              min="0"
              value={form.minOrderAmount}
              onChange={(event) => setForm((c) => ({ ...c, minOrderAmount: event.target.value }))}
              hint="0 means no minimum."
            />
            <Input
              label="Expiry date"
              type="date"
              value={form.expiresAt}
              onChange={(event) => setForm((c) => ({ ...c, expiresAt: event.target.value }))}
              error={errors.expiresAt}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Total usage limit"
              type="number"
              min="0"
              value={form.usageLimit}
              onChange={(event) => setForm((c) => ({ ...c, usageLimit: event.target.value }))}
              hint="0 means unlimited."
            />
            <Input
              label="Per-customer limit"
              type="number"
              min="0"
              value={form.perUserLimit}
              onChange={(event) => setForm((c) => ({ ...c, perUserLimit: event.target.value }))}
              hint="How many times one customer may use it."
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((c) => ({ ...c, isActive: event.target.checked }))}
              className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
            />
            Active and usable at checkout
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Saving...">
              Save coupon
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.code}?`}
        message="Orders that already used this code keep their discount. Disable it instead if you may want it back."
        confirmLabel="Delete coupon"
      />
    </div>
  );
};

export default Coupons;
