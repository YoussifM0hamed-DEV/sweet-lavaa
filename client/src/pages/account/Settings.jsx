import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock, FiAlertTriangle, FiMail } from 'react-icons/fi';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import authService from '../../services/authService.js';
import { userService } from '../../services/commerceService.js';
import { miscService } from '../../services/catalogService.js';
import { tokenStore } from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

const Settings = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const isGoogleAccount = user?.provider === 'google';

  const changePassword = async (event) => {
    event.preventDefault();

    const found = {};
    if (!form.currentPassword) found.currentPassword = 'Enter your current password.';
    if (form.newPassword.length < 8) found.newPassword = 'Password must be at least 8 characters.';
    else if (!/[a-zA-Z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
      found.newPassword = 'Include at least one letter and one number.';
    }
    if (form.newPassword !== form.confirmPassword) found.confirmPassword = 'Passwords do not match.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSaving(true);
    try {
      const response = await authService.changePassword(form);
      // The server rotates the session, so store the new token.
      tokenStore.set(response.data.token);
      setUser(response.data.user);
      toast.success(response.message || 'Your password has been updated.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setErrors({ ...error.toFieldMap?.(), form: error.message });
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const unsubscribe = async () => {
    setIsUnsubscribing(true);
    try {
      await miscService.subscribe(user.email, 'settings');
      toast.success('You are subscribed to our newsletter.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const deleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteMyAccount();
      toast.success('Your account has been deactivated.');
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-cocoa-800">Account settings</h1>
        <p className="mt-1 text-sm text-cocoa-400">Security, communication preferences and account status.</p>
      </div>

      <section className="card p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
          <FiLock className="text-caramel-600" /> Password
        </h2>

        {isGoogleAccount ? (
          <p className="mt-4 rounded-xl bg-cream-200 px-4 py-3.5 text-sm leading-relaxed text-cocoa-500">
            You sign in with Google, so there is no password on this account. Manage your credentials in your Google
            account settings.
          </p>
        ) : (
          <form onSubmit={changePassword} className="mt-6 max-w-md space-y-5" noValidate>
            {errors.form && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>
            )}

            <Input
              label="Current password"
              type="password"
              value={form.currentPassword}
              onChange={(event) => setForm((c) => ({ ...c, currentPassword: event.target.value }))}
              error={errors.currentPassword}
              autoComplete="current-password"
              required
            />
            <Input
              label="New password"
              type="password"
              value={form.newPassword}
              onChange={(event) => setForm((c) => ({ ...c, newPassword: event.target.value }))}
              error={errors.newPassword}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((c) => ({ ...c, confirmPassword: event.target.value }))}
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
            />

            <Button type="submit" isLoading={isSaving} loadingText="Updating...">
              Update password
            </Button>
          </form>
        )}
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
          <FiMail className="text-caramel-600" /> Email preferences
        </h2>
        <p className="mt-2 text-sm text-cocoa-400">
          We send one email a month with new flavours and the occasional discount code.
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={unsubscribe} isLoading={isUnsubscribing}>
          Subscribe to the newsletter
        </Button>
      </section>

      <section className="card border-red-200 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-lg text-red-700">
          <FiAlertTriangle /> Deactivate account
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cocoa-400">
          Deactivating signs you out everywhere and disables sign-in. Your past orders are kept for our accounting
          records, as explained in the privacy policy. Contact us if you want to come back.
        </p>
        <Button variant="danger" size="sm" className="mt-5" onClick={() => setConfirmDelete(true)}>
          Deactivate my account
        </Button>
      </section>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteAccount}
        isLoading={isDeleting}
        title="Deactivate your account?"
        message="You will be signed out immediately and will not be able to sign back in."
        confirmLabel="Yes, deactivate"
        cancelLabel="Keep my account"
      />
    </div>
  );
};

export default Settings;
