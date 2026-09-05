import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AnnouncementBar from '../components/layout/AnnouncementBar.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';

const StoreLayout = () => {
  const { pathname } = useLocation();

  /* Every navigation starts at the top of the new page. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-cocoa-800 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-cream-100"
      >
        Skip to content
      </a>

      <AnnouncementBar />
      <Navbar />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default StoreLayout;
