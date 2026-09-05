import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  FiGrid, FiBox, FiTag, FiShoppingCart, FiUsers, FiShield, FiPercent, FiMapPin,
  FiSettings, FiBarChart2, FiArchive, FiStar, FiMenu, FiX, FiLogOut, FiExternalLink,
  FiBell, FiUser,
} from 'react-icons/fi';
import Logo from '../components/layout/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminStatsService } from '../services/adminService.js';
import { cn } from '../utils/cn.js';
import { initials } from '../utils/format.js';
import { ROLE_META } from '../utils/constants.js';
import useLockBodyScroll from '../hooks/useLockBodyScroll.js';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    links: [
      { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true, permission: 'analytics:view' },
      { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2, permission: 'analytics:view' },
    ],
  },
  {
    title: 'Catalogue',
    links: [
      { to: '/admin/products', label: 'Products', icon: FiBox, permission: 'product:view' },
      { to: '/admin/categories', label: 'Categories', icon: FiTag, permission: 'category:manage' },
      { to: '/admin/inventory', label: 'Inventory', icon: FiArchive, permission: 'inventory:manage' },
      { to: '/admin/reviews', label: 'Reviews', icon: FiStar, permission: 'review:moderate' },
    ],
  },
  {
    title: 'Sales',
    links: [
      { to: '/admin/orders', label: 'Orders', icon: FiShoppingCart, permission: 'order:view' },
      { to: '/admin/coupons', label: 'Coupons', icon: FiPercent, permission: 'coupon:manage' },
      { to: '/admin/delivery-zones', label: 'Delivery zones', icon: FiMapPin, permission: 'delivery:manage' },
    ],
  },
  {
    title: 'People',
    links: [
      { to: '/admin/customers', label: 'Customers', icon: FiUsers, permission: 'customer:view' },
      { to: '/admin/users', label: 'Users & roles', icon: FiShield, permission: 'user:manage' },
    ],
  },
  {
    title: 'Configuration',
    links: [
      { to: '/admin/settings', label: 'Website settings', icon: FiSettings, permission: 'settings:manage' },
      { to: '/admin/profile', label: 'My profile', icon: FiUser },
    ],
  },
];

const SidebarContent = ({ onNavigate, hasPermission }) => (
  <>
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-cocoa-600/50 px-5">
      <Logo tone="light" />
      <span className="rounded-full bg-caramel-500/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-caramel-300">
        Admin
      </span>
    </div>

    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin">
      {NAV_SECTIONS.map((section) => {
        const links = section.links.filter((link) => !link.permission || hasPermission(link.permission));
        if (!links.length) return null;

        return (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-cream-300/35">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-caramel-500 text-white shadow-soft'
                        : 'text-cream-200/65 hover:bg-cocoa-600/40 hover:text-cream-100',
                    )
                  }
                >
                  <link.icon className="shrink-0 text-base" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>

    <div className="shrink-0 border-t border-cocoa-600/50 p-3">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream-200/65 transition-colors hover:bg-cocoa-600/40 hover:text-cream-100"
      >
        <FiExternalLink className="text-base" /> View storefront
      </Link>
    </div>
  </>
);

const AdminLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [alerts, setAlerts] = useState({ pendingReviews: 0, newMessages: 0, lowStock: 0, outOfStock: 0 });

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* A light poll keeps the bell badge current without a websocket. */
  useEffect(() => {
    if (!hasPermission('analytics:view')) return undefined;

    let cancelled = false;
    const load = () =>
      adminStatsService
        .overview()
        .then((response) => {
          if (!cancelled) setAlerts(response.data.attention);
        })
        .catch(() => {});

    load();
    const timer = setInterval(load, 120000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [hasPermission]);

  const alertCount = alerts.pendingReviews + alerts.newMessages + alerts.outOfStock;
  const role = ROLE_META[user?.role] || ROLE_META.customer;

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-cocoa-800 lg:flex">
        <SidebarContent hasPermission={hasPermission} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 animate-fade-in cursor-default bg-cocoa-900/60 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-slide-in-right flex-col bg-cocoa-800">
            <SidebarContent onNavigate={() => setMobileOpen(false)} hasPermission={hasPermission} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-cream-300 bg-cream-50/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-cocoa-600 transition-colors hover:bg-cream-200 lg:hidden"
            >
              <FiMenu className="text-xl" />
            </button>

            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-cocoa-800">
                Welcome back, {user?.firstName}
              </p>
              <p className="text-xs text-cocoa-300">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/admin/inventory"
                aria-label={`${alertCount} items need attention`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-cocoa-600 transition-colors hover:bg-cream-200"
              >
                <FiBell className="text-lg" />
                {alertCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold text-white">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </Link>

              <Link
                to="/admin/profile"
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-cream-200"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 text-[0.7rem] font-bold text-cream-100">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(user?.fullName || '')
                  )}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight text-cocoa-800">{user?.firstName}</span>
                  <span className="block text-[0.65rem] leading-tight text-cocoa-300">{role.label}</span>
                </span>
              </Link>

              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full text-cocoa-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
