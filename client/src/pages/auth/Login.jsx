import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import Seo from '../../components/ui/Seo.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import GoogleButton from './GoogleButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Please enter a valid email address.';
    if (!form.password) found.password = 'Please enter your password.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSubmitting(true);
    try {
      const user = await login(form);
      navigate(user.role === 'customer' ? redirectTo : '/admin', { replace: true });
    } catch (error) {
      setErrors({ ...error.toFieldMap?.(), form: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Sign in" noIndex />

      <h1 className="text-display-sm">Welcome back</h1>
      <p className="lede mt-2 text-base">Sign in to track your orders and pick up where you left off.</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>
        )}

        <Input
          label="Email"
          type="email"
          icon={FiMail}
          value={form.email}
          onChange={(event) => setField('email', event.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          icon={FiLock}
          value={form.password}
          onChange={(event) => setField('password', event.target.value)}
          error={errors.password}
          placeholder="Your password"
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-cocoa-500">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) => setField('rememberMe', event.target.checked)}
              className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-semibold text-caramel-700 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>

      <GoogleButton onSuccess={(user) => navigate(user.role === 'customer' ? redirectTo : '/admin', { replace: true })} />

      <p className="mt-8 text-center text-sm text-cocoa-400">
        New to Sweet Lava?{' '}
        <Link to="/register" className="font-semibold text-caramel-700 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
};

export default Login;
