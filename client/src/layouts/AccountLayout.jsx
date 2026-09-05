import { NavLink, Outlet } from 'react-router-dom';
import { FiUser, FiPackage, FiMapPin, FiHeart, FiStar, FiLogOut, FiSettings } from 'react-icons/fi';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';
import { cn } from '../utils/cn.js';

const LINKS = [
  { to: '/account', label: 'Profile', icon: FiUser, end: true },
  { to: '/account/orders', label: 'My orders', icon: FiPackage },
  { to: '/account/addresses', label: 'Addresses', icon: FiMapPin },
  { to: '/account/reviews', label: 'My reviews', icon: FiStar },
  { to: '/wishlist', label: 'Wishlist', icon: FiHeart },
  { to: '/account/settings', label: 'Settings', icon: FiSettings },
];

const AccountLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="section">
      <div className="container-page">
        <PageHeader title="My account" breadcrumbs={[{ label: 'My account' }]} />

        <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside>
            <div className="card p-5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 font-display font-semibold text-cream-100">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(user?.fullName || '')
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-cocoa-800">{user?.fullName}</p>
                  <p className="truncate text-xs text-cocoa-300">{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="mt-4 space-y-1" aria-label="Account">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-cocoa-800 text-cream-100 shadow-soft'
                        : 'text-cocoa-500 hover:bg-cream-200 hover:text-cocoa-800',
                    )
                  }
                >
                  <link.icon className="text-base" />
                  {link.label}
                </NavLink>
              ))}

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <FiLogOut className="text-base" />
                Sign out
              </button>
            </nav>
          </aside>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
