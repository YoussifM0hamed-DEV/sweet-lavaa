import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiX, FiChevronRight, FiLogOut, FiUser, FiPackage, FiHeart, FiSettings, FiPhone, FiMail } from 'react-icons/fi';
import Logo from './Logo.jsx';
import Button from '../ui/Button.jsx';
import { categoryService } from '../../services/catalogService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';
import { cn } from '../../utils/cn.js';
import { initials } from '../../utils/format.js';

/**
 * Purpose-built mobile navigation: a full-height panel with the account block
 * up top, primary links, then category shortcuts. Not a shrunk desktop nav.
 */
const MobileMenu = ({ isOpen, onClose, links }) => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const { settings } = useSettings();
  const [categories, setCategories] = useState([]);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen || categories.length) return;
    categoryService
      .list({ featured: 'true' })
      .then((response) => setCategories(response.data.categories.slice(0, 6)))
      .catch(() => setCategories([]));
  }, [isOpen, categories.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-cocoa-900/50 backdrop-blur-sm"
      />

      <nav className="absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-cream-50 shadow-lift">
        <header className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            <FiX className="text-lg" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isAuthenticated ? (
            <div className="border-b border-cream-300 p-5">
              <Link to="/account" onClick={onClose} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 text-sm font-bold text-cream-100">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(user.fullName)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-cocoa-800">{user.fullName}</span>
                  <span className="block truncate text-xs text-cocoa-300">{user.email}</span>
                </span>
                <FiChevronRight className="text-cocoa-300" />
              </Link>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { to: '/account/orders', label: 'Orders', icon: FiPackage },
                  { to: '/wishlist', label: 'Wishlist', icon: FiHeart },
                  { to: '/account', label: 'Profile', icon: FiUser },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-cream-200 py-3 text-[0.7rem] font-semibold text-cocoa-600 transition-colors hover:bg-cream-300"
                  >
                    <item.icon className="text-base text-caramel-600" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-b border-cream-300 p-5">
              <p className="font-display text-lg text-cocoa-800">Welcome to Sweet Lava</p>
              <p className="mt-1 text-sm text-cocoa-400">Sign in to track orders and save favourites.</p>
              <div className="mt-4 flex gap-2">
                <Button to="/login" onClick={onClose} size="sm" className="flex-1">
                  Sign in
                </Button>
                <Button to="/register" onClick={onClose} variant="outline" size="sm" className="flex-1">
                  Register
                </Button>
              </div>
            </div>
          )}

          <div className="p-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg transition-colors',
                    isActive ? 'bg-cream-200 text-cocoa-900' : 'text-cocoa-600 hover:bg-cream-200',
                  )
                }
              >
                {link.label}
                <FiChevronRight className="text-cocoa-200" />
              </NavLink>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="border-t border-cream-300 p-5">
              <p className="eyebrow mb-3">Shop by category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/categories/${category.slug}`}
                    onClick={onClose}
                    className="rounded-full border border-cream-400 px-3.5 py-1.5 text-xs font-medium text-cocoa-600 transition-colors hover:border-cocoa-800 hover:bg-cocoa-800 hover:text-cream-100"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isStaff && (
            <div className="px-5 pb-5">
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl bg-cocoa-800 py-3 text-sm font-semibold text-cream-100"
              >
                <FiSettings /> Admin dashboard
              </Link>
            </div>
          )}
        </div>

        <footer className="border-t border-cream-300 p-5">
          {settings.contact?.phone && (
            <a href={`tel:${settings.contact.phone}`} className="flex items-center gap-2.5 py-1.5 text-sm text-cocoa-500">
              <FiPhone className="text-caramel-600" /> {settings.contact.phone}
            </a>
          )}
          {settings.contact?.email && (
            <a href={`mailto:${settings.contact.email}`} className="flex items-center gap-2.5 py-1.5 text-sm text-cocoa-500">
              <FiMail className="text-caramel-600" /> {settings.contact.email}
            </a>
          )}

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600"
            >
              <FiLogOut /> Sign out
            </button>
          )}
        </footer>
      </nav>
    </div>
  );
};

export default MobileMenu;
