import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiMapPin, FiTruck } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Input, { Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminZoneService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const EMPTY = {
  name: '', governorate: 'Cairo', deliveryFee: '', freeDeliveryThreshold: '',
  estimatedTime: '1-2 Days', minimumOrderAmount: '', displayOrder: 0, isActive: true, notes: '',
};

const DeliveryZones = () => {
  const { currency } = useSettings();

  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    adminZoneService
      .list()
      .then((response) => setZones(response.data.zones))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const save = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.name.trim().length < 2) found.name = 'Area name is required.';
    if (form.deliveryFee === '' || Number(form.deliveryFee) < 0) found.deliveryFee = 'Enter a delivery fee.';

    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      name: form.name.trim(),
      governorate: form.governorate,
      deliveryFee: Number(form.deliveryFee),
      freeDeliveryThreshold: Number(form.freeDeliveryThreshold) || 0,
      estimatedTime: form.estimatedTime,
      minimumOrderAmount: Number(form.minimumOrderAmount) || 0,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
      notes: form.notes,
    };

    setIsSaving(true);
    try {
      if (editing === 'new') await adminZoneService.create(payload);
      else await adminZoneService.update(editing, payload);

      toast.success(editing === 'new' ? 'Delivery area added.' : 'Delivery area updated.');
      setEditing(null);
      load();
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (zone) => {
    try {
      const response = await adminZoneService.toggleStatus(zone._id);
      toast.success(response.message);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async () => {
    try {
      await adminZoneService.remove(deleteTarget._id);
      toast.success('Delivery area deleted.');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Delivery zones"
        description="Fees and estimates here drive exactly what customers are charged at checkout."
      >
        <Button
          size="sm"
          icon={FiPlus}
          onClick={() => {
            setForm({ ...EMPTY, displayOrder: zones.length });
            setErrors({});
            setEditing('new');
          }}
        >
          Add area
        </Button>
      </AdminPageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-card" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiMapPin}
            title="No delivery areas yet"
            message="Add at least one area so customers can check out."
            actionLabel="Add area"
            onAction={() => {
              setForm(EMPTY);
              setEditing('new');
            }}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {zones.map((zone) => (
            <article key={zone._id} className={cn('card p-5', !zone.isActive && 'opacity-70')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg text-cocoa-800">{zone.name}</h2>
                  <p className="text-xs text-cocoa-300">{zone.governorate}</p>
                </div>
                <Badge tone={zone.isActive ? 'success' : 'neutral'}>{zone.isActive ? 'Active' : 'Disabled'}</Badge>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-cocoa-400">Delivery fee</dt>
                  <dd className="font-semibold text-cocoa-800">{formatPrice(zone.deliveryFee, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cocoa-400">Free over</dt>
                  <dd className="font-medium text-cocoa-600">
                    {zone.freeDeliveryThreshold > 0 ? formatPrice(zone.freeDeliveryThreshold, currency) : 'Never'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-cocoa-400">Minimum order</dt>
                  <dd className="font-medium text-cocoa-600">
                    {zone.minimumOrderAmount > 0 ? formatPrice(zone.minimumOrderAmount, currency) : 'None'}
                  </dd>
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs text-cocoa-400">
                  <FiTruck className="text-caramel-600" /> {zone.estimatedTime}
                </div>
              </dl>

              <div className="mt-4 flex justify-end gap-1 border-t border-cream-300 pt-4">
                <button
                  type="button"
                  onClick={() => toggleStatus(zone)}
                  aria-label={zone.isActive ? 'Disable area' : 'Enable area'}
                  className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
                >
                  {zone.isActive ? <FiToggleRight className="text-base text-emerald-500" /> : <FiToggleLeft className="text-base" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...EMPTY,
                      ...zone,
                      freeDeliveryThreshold: zone.freeDeliveryThreshold || '',
                      minimumOrderAmount: zone.minimumOrderAmount || '',
                    });
                    setErrors({});
                    setEditing(zone._id);
                  }}
                  aria-label="Edit area"
                  className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
                >
                  <FiEdit2 className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(zone)}
                  aria-label="Delete area"
                  className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a delivery area' : 'Edit delivery area'}
      >
        <form onSubmit={save} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Area name"
              value={form.name}
              onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
              error={errors.name}
              placeholder="New Cairo"
              required
            />
            <Input
              label="Governorate"
              value={form.governorate}
              onChange={(event) => setForm((c) => ({ ...c, governorate: event.target.value }))}
              placeholder="Cairo"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={`Delivery fee (${currency})`}
              type="number"
              min="0"
              value={form.deliveryFee}
              onChange={(event) => setForm((c) => ({ ...c, deliveryFee: event.target.value }))}
              error={errors.deliveryFee}
              required
            />
            <Input
              label={`Free delivery over (${currency})`}
              type="number"
              min="0"
              value={form.freeDeliveryThreshold}
              onChange={(event) => setForm((c) => ({ ...c, freeDeliveryThreshold: event.target.value }))}
              hint="0 disables free delivery."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Estimated delivery time"
              value={form.estimatedTime}
              onChange={(event) => setForm((c) => ({ ...c, estimatedTime: event.target.value }))}
              placeholder="1-2 Days"
            />
            <Input
              label={`Minimum order (${currency})`}
              type="number"
              min="0"
              value={form.minimumOrderAmount}
              onChange={(event) => setForm((c) => ({ ...c, minimumOrderAmount: event.target.value }))}
              hint="0 means no minimum for this area."
            />
          </div>

          <Input
            label="Display order"
            type="number"
            value={form.displayOrder}
            onChange={(event) => setForm((c) => ({ ...c, displayOrder: event.target.value }))}
            hint="Lower numbers appear first at checkout."
          />

          <Textarea
            label="Internal notes"
            value={form.notes}
            onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))}
            placeholder="Anything the delivery team should know."
            rows={2}
          />

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((c) => ({ ...c, isActive: event.target.checked }))}
              className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
            />
            We currently deliver to this area
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Saving...">
              Save area
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.name}?`}
        message="Areas already used by an order cannot be deleted. Disable it instead to stop taking new orders there."
        confirmLabel="Delete area"
      />
    </div>
  );
};

export default DeliveryZones;
