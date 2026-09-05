import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';
import Seo from '../../components/ui/Seo.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import GoogleButton from './GoogleButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

/** Simple, honest strength meter: length plus character variety. */
const strengthOf = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
};

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const strength = strengthOf(form.password);

  const submit = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.firstName.trim().length < 2) found.firstName = 'First name must be at least 2 characters.';
    if (form.lastName.trim().length < 2) found.lastName = 'Last name must be at least 2 characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Please enter a valid email address.';
    if (form.phone && !/^[+0-9][0-9\s-]{6,19}$/.test(form.phone)) found.phone = 'Please enter a valid phone number.';
    if (form.password.length < 8) found.password = 'Password must be at least 8 characters.';
    else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      found.password = 'Include at least one letter and one number.';
    }
    if (form.password !== form.confirmPassword) found.confirmPassword = 'Passwords do not match.';
    if (!acceptedTerms) found.terms = 'Please accept the terms to continue.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (error) {
      setErrors({ ...error.toFieldMap?.(), form: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Create an account" noIndex />

      <h1 className="text-display-sm">Create your account</h1>
      <p className="lede mt-2 text-base">Faster checkout, order tracking and a wishlist that remembers.</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            icon={FiUser}
            value={form.firstName}
            onChange={(event) => setField('firstName', event.target.value)}
            error={errors.firstName}
            placeholder="Nour"
            autoComplete="given-name"
            required
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(event) => setField('lastName', event.target.value)}
            error={errors.lastName}
            placeholder="Hassan"
            autoComplete="family-name"
            required
          />
        </div>

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
          label="Phone number"
          icon={FiPhone}
          value={form.phone}
          onChange={(event) => setField('phone', event.target.value)}
          error={errors.phone}
          placeholder="01012345678"
          autoComplete="tel"
          hint="Optional, but it helps our courier reach you."
        />

        <div>
          <Input
            label="Password"
            type="password"
            icon={FiLock}
            value={form.password}
            onChange={(event) => setField('password', event.target.value)}
            error={errors.password}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
          {form.password && !errors.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-300',
                      index < strength ? STRENGTH_COLORS[strength] : 'bg-cream-400',
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-cocoa-400">{STRENGTH_LABELS[strength]}</span>
            </div>
          )}
        </div>

        <Input
          label="Confirm password"
          type="password"
          icon={FiLock}
          value={form.confirmPassword}
          onChange={(event) => setField('confirmPassword', event.target.value)}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
          required
        />

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-cocoa-500">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setErrors((current) => ({ ...current, terms: undefined }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-cocoa-300 accent-caramel-500"
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="font-semibold text-caramel-700 hover:underline">
                terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-semibold text-caramel-700 hover:underline">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && <p className="field-error">{errors.terms}</p>}
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Creating your account…">
          Create account
        </Button>
      </form>

      <GoogleButton onSuccess={() => navigate('/', { replace: true })} />

      <p className="mt-8 text-center text-sm text-cocoa-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-caramel-700 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
};

export default Register;
