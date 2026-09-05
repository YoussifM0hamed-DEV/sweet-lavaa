import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCamera, FiSave, FiLock, FiShield } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { userService } from '../../services/commerceService.js';
import authService from '../../services/authService.js';
import { tokenStore } from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { initials, formatDate } from '../../utils/format.js';
import { ROLE_META } from '../../utils/constants.js';

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' });
  }, [user]);

  const role = ROLE_META[user?.role] || ROLE_META.customer;

  const saveProfile = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.firstName.trim().length < 2) found.firstName = 'First name is required.';
    if (form.lastName.trim().length < 2) found.lastName = 'Last name is required.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSaving(true);
    try {
      const response = await userService.updateProfile(form);
      setUser(response.data.user);
      toast.success('Your profile has been updated.');
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    const found = {};
    if (!passwords.currentPassword) found.currentPassword = 'Enter your current password.';
    if (passwords.newPassword.length < 8) found.newPassword = 'Password must be at least 8 characters.';
    else if (!/[a-zA-Z]/.test(passwords.newPassword) || !/[0-9]/.test(passwords.newPassword)) {
      found.newPassword = 'Include at least one letter and one number.';
    }
    if (passwords.newPassword !== passwords.confirmPassword) found.confirmPassword = 'Passwords do not match.';

    setPasswordErrors(found);
    if (Object.keys(found).length) return;

    setIsChangingPassword(true);
    try {
      const response = await authService.changePassword(passwords);
      tokenStore.set(response.data.token);
      setUser(response.data.user);
      toast.success('Your password has been updated.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordErrors({ ...error.toFieldMap?.(), form: error.message });
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please choose an image under 5 MB.');
      event.target.value = '';
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
    <div>
      <AdminPageHeader title="My profile" description="Your account details and dashboard access." />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <section className="card p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 font-display text-2xl font-semibold text-cream-100">
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
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-cream-50 bg-caramel-500 text-white transition-colors hover:bg-caramel-600 disabled:opacity-60"
              >
                <FiCamera className="text-sm" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </div>

            <p className="mt-4 font-display text-xl text-cocoa-800">{user?.fullName}</p>
            <p className="text-sm text-cocoa-300">{user?.email}</p>
            <Badge tone={role.tone} className="mt-3">
              {role.label}
            </Badge>
            <p className="mt-3 text-xs text-cocoa-300">Member since {formatDate(user?.createdAt)}</p>
          </div>

          <div className="mt-6 border-t border-cream-300 pt-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cocoa-400">
              <FiShield className="text-caramel-600" /> Your permissions
            </h2>
            <ul className="mt-3 space-y-1.5">
              {(user?.permissions || []).map((permission) => (
                <li key={permission} className="text-xs text-cocoa-400">
                  {permission.replace(':', ' · ')}
                </li>
              ))}
              {(user?.permissions || []).length === 0 && (
                <li className="text-xs text-cocoa-300">No dashboard permissions granted.</li>
              )}
            </ul>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-lg text-cocoa-800">Profile details</h2>

            <form onSubmit={saveProfile} className="mt-5 space-y-5" noValidate>
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

              <Input label="Email" value={user?.email || ''} disabled hint="Contact a super admin to change this." />

              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
                error={errors.phone}
              />

              <Button type="submit" icon={FiSave} isLoading={isSaving} loadingText="Saving...">
                Save changes
              </Button>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiLock className="text-caramel-600" /> Change password
            </h2>

            <form onSubmit={changePassword} className="mt-5 max-w-md space-y-5" noValidate>
              {passwordErrors.form && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {passwordErrors.form}
                </div>
              )}

              <Input
                label="Current password"
                type="password"
                value={passwords.currentPassword}
                onChange={(event) => setPasswords((c) => ({ ...c, currentPassword: event.target.value }))}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
                required
              />
              <Input
                label="New password"
                type="password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords((c) => ({ ...c, newPassword: event.target.value }))}
                error={passwordErrors.newPassword}
                autoComplete="new-password"
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                value={passwords.confirmPassword}
                onChange={(event) => setPasswords((c) => ({ ...c, confirmPassword: event.target.value }))}
                error={passwordErrors.confirmPassword}
                autoComplete="new-password"
                required
              />

              <Button type="submit" variant="outline" isLoading={isChangingPassword} loadingText="Updating...">
                Update password
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
