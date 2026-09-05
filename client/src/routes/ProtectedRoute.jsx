import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const FullPageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center text-cocoa-300">
    <Spinner size="lg" />
  </div>
);

/** Requires a signed-in customer; remembers where they were headed. */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};

/**
 * Requires a staff account, and optionally a specific permission.
 * The server enforces the same rules — this only keeps the UI honest.
 */
export const AdminRoute = ({ children, permission }) => {
  const { isAuthenticated, isStaff, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isStaff) return <Navigate to="/" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/admin" replace />;

  return children;
};

/** Keeps signed-in customers away from the login and register screens. */
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  return children;
};

export default ProtectedRoute;
