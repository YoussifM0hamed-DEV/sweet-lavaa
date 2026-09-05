import { Link } from 'react-router-dom';
import { FiHome, FiSearch } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import Button from '../components/ui/Button.jsx';

const NotFound = () => (
  <>
    <Seo title="Page not found" noIndex />

    <div className="container-page flex min-h-[65vh] items-center justify-center py-16">
      <div className="max-w-lg text-center">
        <p className="font-display text-[7rem] leading-none text-caramel-200 sm:text-[9rem]">404</p>

        <h1 className="-mt-4 text-display-sm">This page has been eaten</h1>
        <p className="lede mt-4">
          We could not find what you were looking for. It may have moved, or the link may be out of date.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button to="/" icon={FiHome}>
            Back to home
          </Button>
          <Button to="/products" variant="outline" icon={FiSearch}>
            Browse products
          </Button>
        </div>

        <p className="mt-10 text-sm text-cocoa-300">
          Looking for something specific?{' '}
          <Link to="/contact" className="font-semibold text-caramel-700 hover:underline">
            Ask us
          </Link>
        </p>
      </div>
    </div>
  </>
);

export default NotFound;
