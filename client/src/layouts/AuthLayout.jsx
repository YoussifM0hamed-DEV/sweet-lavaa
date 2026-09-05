import { Link, Outlet } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Logo from '../components/layout/Logo.jsx';
import SmartImage from '../components/ui/SmartImage.jsx';
import { IMAGE_URLS } from '../utils/heroImages.js';

/** Split layout: form on the left, an appetising still on the right. */
const AuthLayout = () => (
  <div className="grid min-h-screen lg:grid-cols-2">
    <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
      <header className="flex items-center justify-between">
        <Logo />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-400 transition-colors hover:text-cocoa-800"
        >
          <FiArrowLeft /> Back to shop
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      <footer className="text-center text-xs text-cocoa-300">
        &copy; {new Date().getFullYear()} Sweet Lava. Handcrafted in Cairo.
      </footer>
    </div>

    <div className="relative hidden lg:block">
      <SmartImage src={IMAGE_URLS.heroMain} alt="" width={1200} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/90 via-cocoa-900/40 to-cocoa-900/10" />

      <div className="absolute inset-x-0 bottom-0 p-12">
        <p className="eyebrow text-caramel-300">Sweet Lava</p>
        <p className="mt-4 max-w-md font-display text-3xl leading-tight text-cream-50">
          Every order is baked the morning it reaches you.
        </p>
        <p className="mt-3 max-w-sm text-sm text-cream-200/70">
          Join thousands of customers across Cairo who order their celebrations from us.
        </p>
      </div>
    </div>
  </div>
);

export default AuthLayout;
