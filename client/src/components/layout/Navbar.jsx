import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX, FiLogOut,
  FiPackage, FiGrid, FiChevronDown, FiSettings,
} from 'react-icons/fi';
import Logo from './Logo.jsx';
import SearchOverlay from './SearchOverlay.jsx';
import CartDrawer from './CartDrawer.jsx';
import MobileMenu from './MobileMenu.jsx';
import { cn } from '../../utils/cn.js';
import { initials } from '../../utils/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import useOnClickOutside from '../../hooks/useOnClickOutside.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const IconButton = ({ icon: Icon, label, count, onClick, to, bump, className }) => {
  const content = (
    <>
      <Icon className="text-[1.15rem]" />
      {count > 0 && (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-caramel-500 px-1 text-[0.65rem] font-bold text-white',
            bump && 'animate-cart-bump',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );

  const base = cn(
    'relative flex h-10 w-10 items-center justify-center rounded-full text-cocoa-600 transition-all duration-300 hover:bg-cream-200 hover:text-cocoa-900',
    className,
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} className={base}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={base}>
      {content}
    </button>
  );
};

const AccountMenu = () => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useOnClickOutside(menuRef, () => setIsOpen(false), isOpen);

  if (!isAuthenticated) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Link to="/login" className="btn-ghost">
          Sign in
        </Link>
        <Link to="/register" className="btn-primary btn-sm">
          Create account
        </Link>
      </div>
    );
  }

  const links = [
    { to: '/account', label: 'My account', icon: FiUser },
    { to: '/account/orders', label: 'My orders', icon: FiPackage },
    { to: '/wishlist', label: 'Wishlist', icon: FiHeart },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-cream-200"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-cocoa-800 text-[0.7rem] font-bold text-cream-100">
          {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : initials(user.fullName)}
        </span>
        <span className="hidden text-sm font-semibold text-cocoa-700 xl:block">{user.firstName}</span>
        <FiChevronDown className={cn('text-cocoa-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] w-60 animate-scale-in overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-lift"
        >
          <div className="border-b border-cream-300 px-4 py-3.5">
            <p className="truncate font-semibold text-cocoa-800">{user.fullName}</p>
            <p className="truncate text-xs text-cocoa-300">{user.email}</p>
          </div>

          <div className="p-1.5">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cocoa-600 transition-colors hover:bg-cream-200 hover:text-cocoa-900"
              >
                <link.icon className="text-cocoa-300" /> {link.label}
              </Link>
            ))}

            {isStaff && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex items-center gap-3 rounded-xl bg-cocoa-800 px-3 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-cocoa-900"
              >
                <FiSettings /> Admin dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-cream-300 p-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <FiLogOut /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  const { itemsCount, bump } = useCart();
  const { count: wishlistCount } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Compact the bar once the page scrolls. */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close every overlay on navigation. */
  useEffect(() => {
    setMenuOpen(false);
    setCartOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  /* Cmd/Ctrl+K opens search, the way people expect. */
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-400 ease-smooth',
          isScrolled ? 'border-b border-cream-300 bg-cream-50/90 shadow-soft backdrop-blur-xl' : 'bg-cream-100',
        )}
      >
        <div className="container-page">
          <div className={cn('flex items-center justify-between gap-4 transition-all duration-300', isScrolled ? 'h-16' : 'h-20')}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-cocoa-700 transition-colors hover:bg-cream-200 lg:hidden"
              >
                <FiMenu className="text-xl" />
              </button>
              <Logo showTagline={!isScrolled} />
            </div>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
                      isActive ? 'text-cocoa-900' : 'text-cocoa-400 hover:text-cocoa-800',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-caramel-500" aria-hidden="true" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <IconButton icon={FiSearch} label="Search products" onClick={() => setSearchOpen(true)} />
              <IconButton icon={FiHeart} label="Wishlist" to="/wishlist" count={wishlistCount} className="hidden sm:flex" />
              <IconButton icon={FiShoppingBag} label="Cart" onClick={() => setCartOpen(true)} count={itemsCount} bump={bump} />
              <div className="ml-1 hidden lg:block">
                <AccountMenu />
              </div>
              <Link
                to="/account"
                aria-label="My account"
                className="flex h-10 w-10 items-center justify-center rounded-full text-cocoa-600 transition-colors hover:bg-cream-200 lg:hidden"
              >
                <FiUser className="text-[1.15rem]" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} />
    </>
  );
};

export default Navbar;
