import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCamera, FiPackage, FiShoppingBag, FiMapPin, FiDollarSign } from 'react-icons/fi';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { userService } from '../../services/commerceService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, initials, formatDate } from '../../utils/format.js';

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="card p-5">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel-100 text-caramel-600">
      <Icon />
    </span>
    <p className="mt-3 font-display text-2xl font-semibold text-cocoa-800">{value}</p>
    <p className="text-xs uppercase tracking-wider text-cocoa-300">{label}</p>
  </div>
);

const Profile = () => {
  const { user, refresh, setUser } = useAuth();
  const { currency } = useSettings();
  const fileRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    userService
      .stats()
      .then((response) => setStats(response.data))
      .catch(() => setStats(null));
  }, []);

  const save = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.firstName.trim().length < 2) found.firstName = 'First name must be at least 2 characters.';
    if (form.lastName.trim().length < 2) found.lastName = 'Last name must be at least 2 characters.';
    if (form.phone && !/^[+0-9][0-9\s-]{6,19}$/.test(form.phone)) found.phone = 'Please enter a valid phone number.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSaving(true);
    try {
      const response = await userService.updateProfile(form);
      setUser(response.data.user);
      toast.success(response.message || 'Your profile has been updated.');
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please choose an image under 5 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await userService.updateAvatar(file);
      setUser(response.data.user);
      toast.success('Your photo has been updated.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats ? (
          <>
            <StatTile icon={FiShoppingBag} label="Total orders" value={stats.ordersCount} />
            <StatTile icon={FiPackage} label="Active orders" value={stats.activeOrders} />
            <StatTile icon={FiDollarSign} label="Total spent" value={formatPrice(stats.totalSpent, currency)} />
            <StatTile icon={FiMapPin} label="Saved addresses" value={stats.savedAddresses} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-card" />)
        )}
      </div>

      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-xl text-cocoa-800">Profile details</h2>
        <p className="mt-1 text-sm text-cocoa-400">This is how we address you and reach you about orders.</p>

        <div className="mt-7 flex flex-wrap items-center gap-5">
          <div className="relative">
            <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 font-display text-xl font-semibold text-cream-100">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(user?.fullName || '')
              )}
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-cream-50 bg-caramel-500 text-white transition-colors hover:bg-caramel-600 disabled:opacity-60"
            >
              <FiCamera className="text-sm" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
          </div>

          <div>
            <p className="font-display text-lg text-cocoa-800">{user?.fullName}</p>
            <p className="text-sm text-cocoa-300">{user?.email}</p>
            <p className="mt-1 text-xs text-cocoa-300">Member since {formatDate(user?.createdAt)}</p>
          </div>
        </div>

        <form onSubmit={save} className="mt-8 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(event) => setForm((c) => ({ ...c, firstName: event.target.value }))}
              error={errors.firstName}
              required
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(event) => setForm((c) => ({ ...c, lastName: event.target.value }))}
              error={errors.lastName}
              required
            />
          </div>

          <Input
            label="Email"
            value={user?.email || ''}
            disabled
            hint="Contact us if you need to change the email on your account."
          />

          <Input
            label="Phone number"
            value={form.phone}
            onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
            error={errors.phone}
            placeholder="01012345678"
          />

          <Button type="submit" isLoading={isSaving} loadingText="Saving…">
            Save changes
          </Button>
        </form>
      </section>
    </div>
  );
};

export default Profile;
