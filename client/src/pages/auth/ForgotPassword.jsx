import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import Seo from '../../components/ui/Seo.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import authService from '../../services/authService.js';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <>
        <Seo title="Check your email" noIndex />
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            <FiCheckCircle />
          </span>
          <h1 className="mt-6 text-display-sm">Check your inbox</h1>
          <p className="lede mt-3 text-base">
            If an account exists for <strong className="text-cocoa-700">{email}</strong>, we have sent a link to reset
            your password. It expires in 30 minutes.
          </p>
          <Button to="/login" variant="outline" className="mt-8">
            Back to sign in
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Forgot password" noIndex />

      <h1 className="text-display-sm">Forgot your password?</h1>
      <p className="lede mt-2 text-base">Enter your email and we will send you a link to set a new one.</p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Input
          label="Email"
          type="email"
          icon={FiMail}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError('');
          }}
          error={error}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} loadingText="Sending…">
          Send reset link
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-cocoa-400">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-caramel-700 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
};

export default ForgotPassword;
