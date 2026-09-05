import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

/**
 * Google sign-in. Renders nothing when no client id is configured, so the rest
 * of the auth form keeps working in a fresh checkout of the project.
 */
const GoogleButton = ({ onSuccess }) => {
  const { loginWithGoogle } = useAuth();
  const [isBusy, setIsBusy] = useState(false);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  const handleCredential = async (response) => {
    setIsBusy(true);
    try {
      const user = await loginWithGoogle(response.credential);
      onSuccess?.(user);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative flex items-center">
        <span className="h-px flex-1 bg-cream-400" />
        <span className="px-4 text-xs uppercase tracking-widest text-cocoa-300">or</span>
        <span className="h-px flex-1 bg-cream-400" />
      </div>

      <div className="mt-6 flex justify-center">
        {isBusy ? (
          <span className="flex h-10 items-center gap-2 text-sm text-cocoa-400">
            <Spinner size="sm" /> Signing you in…
          </span>
        ) : (
          <GoogleLogin
            onSuccess={handleCredential}
            onError={() => toast.error('Google sign-in was cancelled.')}
            shape="pill"
            width="320"
            text="continue_with"
          />
        )}
      </div>
    </div>
  );
};

export default GoogleButton;
