import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import Input, { Textarea, Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { userService } from '../../services/commerceService.js';
import { deliveryZoneService } from '../../services/catalogService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

const EMPTY = {
  label: 'Home', fullName: '', phone: '', governorate: 'Cairo', deliveryZone: '',
  city: '', district: '', street: '', building: '', floor: '', apartment: '', notes: '', isDefault: false,
};

const Addresses = () => {
  const { user, setUser, refresh } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [zones, setZones] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setAddresses(user?.addresses || []);
  }, [user]);

  useEffect(() => {
    deliveryZoneService
      .list()
      .then((response) => setZones(response.data.zones))
      .catch(() => setZones([]));
  }, []);

  const openNew = () => {
    setForm({ ...EMPTY, fullName: user?.fullName || '', phone: user?.phone || '', isDefault: addresses.length === 0 });
    setErrors({});
    setEditing('new');
  };

  const openEdit = (address) => {
    setForm({ ...EMPTY, ...address, deliveryZone: address.deliveryZone || '' });
    setErrors({});
    setEditing(address._id);
  };

  const save = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.fullName.trim().length < 2) found.fullName = 'Please enter the recipient name.';
    if (!/^[+0-9][0-9\s-]{6,19}$/.test(form.phone)) found.phone = 'Please enter a valid phone number.';
    if (form.street.trim().length < 2) found.street = 'Please enter the street address.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSaving(true);
    try {
      const payload = { ...form, deliveryZone: form.deliveryZone || undefined };
      const response =
        editing === 'new'
          ? await userService.addAddress(payload)
          : await userService.updateAddress(editing, payload);

      setAddresses(response.data.addresses);
      setUser((current) => ({ ...current, addresses: response.data.addresses }));
      toast.success(response.message || 'Address saved.');
      setEditing(null);
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    try {
      const response = await userService.deleteAddress(deleteTarget);
      setAddresses(response.data.addresses);
      setUser((current) => ({ ...current, addresses: response.data.addresses }));
      toast.success('Address removed.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const makeDefault = async (addressId) => {
    try {
      const response = await userService.setDefaultAddress(addressId);
      setAddresses(response.data.addresses);
      setUser((current) => ({ ...current, addresses: response.data.addresses }));
      toast.success('Default address updated.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-cocoa-800">Saved addresses</h1>
          <p className="mt-1 text-sm text-cocoa-400">Save up to 10 addresses for a faster checkout.</p>
        </div>
        <Button onClick={openNew} icon={FiPlus} size="sm" disabled={addresses.length >= 10}>
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiMapPin}
            title="No addresses saved yet"
            message="Add one now, or save it automatically the next time you check out."
            actionLabel="Add an address"
            onAction={openNew}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address._id}
              className={cn('card p-5 transition-shadow duration-300', address.isDefault && 'ring-2 ring-caramel-300')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-cocoa-800">{address.label}</span>
                    {address.isDefault && <Badge tone="success">Default</Badge>}
                  </p>
                  <p className="mt-1 text-sm font-medium text-cocoa-600">{address.fullName}</p>
                  <p className="text-sm text-cocoa-400">{address.phone}</p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    aria-label="Edit address"
                    className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(address._id)}
                    aria-label="Delete address"
                    className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>

              <address className="mt-3 text-sm not-italic leading-relaxed text-cocoa-400">
                {[
                  address.street,
                  address.building && `Building ${address.building}`,
                  address.floor && `Floor ${address.floor}`,
                  address.apartment && `Apt ${address.apartment}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
                <br />
                {[address.district, address.city, address.governorate].filter(Boolean).join(', ')}
              </address>

              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => makeDefault(address._id)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-caramel-700 hover:underline"
                >
                  <FiCheck /> Make default
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add an address' : 'Edit address'}
        size="lg"
      >
        <form onSubmit={save} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Label"
              value={form.label}
              onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))}
              placeholder="Home, Office"
            />
            <Select
              label="Delivery area"
              value={form.deliveryZone}
              onChange={(event) => setForm((c) => ({ ...c, deliveryZone: event.target.value }))}
            >
              <option value="">Choose an area</option>
              {zones.map((zone) => (
                <option key={zone._id} value={zone._id}>
                  {zone.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Recipient name"
              value={form.fullName}
              onChange={(event) => setForm((c) => ({ ...c, fullName: event.target.value }))}
              error={errors.fullName}
              required
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
              error={errors.phone}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Governorate"
              value={form.governorate}
              onChange={(event) => setForm((c) => ({ ...c, governorate: event.target.value }))}
            />
            <Input
              label="City"
              value={form.city}
              onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))}
            />
            <Input
              label="District"
              value={form.district}
              onChange={(event) => setForm((c) => ({ ...c, district: event.target.value }))}
            />
            <Input
              label="Street"
              value={form.street}
              onChange={(event) => setForm((c) => ({ ...c, street: event.target.value }))}
              error={errors.street}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Building"
              value={form.building}
              onChange={(event) => setForm((c) => ({ ...c, building: event.target.value }))}
            />
            <Input
              label="Floor"
              value={form.floor}
              onChange={(event) => setForm((c) => ({ ...c, floor: event.target.value }))}
            />
            <Input
              label="Apartment"
              value={form.apartment}
              onChange={(event) => setForm((c) => ({ ...c, apartment: event.target.value }))}
            />
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))}
            placeholder="Gate code, landmark, delivery instructions."
            rows={2}
          />

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-500">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm((c) => ({ ...c, isDefault: event.target.checked }))}
              className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
            />
            Use this as my default address
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Saving...">
              Save address
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete this address?"
        message="You can always add it again later."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Addresses;
