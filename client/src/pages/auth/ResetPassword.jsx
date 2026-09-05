import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock } from 'react-icons/fi';
import Seo from '../../components/ui/Seo.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import authService from '../../services/authService.js';
import { tokenStore } from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.password.length < 8) found.password = 'Password must be at least 8 characters.';
    else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      found.password = 'Include at least one letter and one number.';
    }
    if (form.password !== form.confirmPassword) found.confirmPassword = 'Passwords do not match.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSubmitting(true);
    try {
      const response = await authService.resetPassword(token, form);
      // The server issues a fresh session, so the customer is signed straight in.
      tokenStore.set(response.data.token);
      setUser(response.data.user);
      toast.success('Your password has been reset.');
      navigate('/', { replace: true });
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Set a new password" noIndex />

      <h1 className="text-display-sm">Set a new password</h1>
      <p className="lede mt-2 text-base">Choose something you have not used before.</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.form}
            <Link to="/forgot-password" className="ml-1 font-semibold underline">
              Request a new link
            </Link>
          </div>
        )}

        <Input
          label="New password"
          type="password"
          icon={FiLock}
          value={form.password}
          onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirm new password"
          type="password"
          icon={FiLock}
          value={form.confirmPassword}
          onChange={(event) => setForm((c) => ({ ...c, confirmPassword: event.target.value }))}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Saving…">
          Reset password
        </Button>
      </form>
    </>
  );
};

export default ResetPassword;
