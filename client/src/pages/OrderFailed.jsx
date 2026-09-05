import { Link, useSearchParams } from 'react-router-dom';
import { FiXCircle, FiRefreshCw, FiMessageCircle } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import Button from '../components/ui/Button.jsx';

const REASONS = [
  'The card was declined by your bank.',
  'The card details or OTP were entered incorrectly.',
  'The payment window timed out before it completed.',
  'Insufficient funds or a daily online limit on the card.',
];

const OrderFailed = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <>
      <Seo title="Payment failed" noIndex />

      <div className="container-page section">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-red-100 text-4xl text-red-600">
            <FiXCircle />
          </span>

          <h1 className="mt-7 text-display-md">Payment could not be completed</h1>
          <p className="lede mt-4">
            Nothing has been charged. Your items are still in your cart, so you can try again whenever you are ready.
          </p>

          {orderNumber && (
            <p className="mt-6 inline-block rounded-full bg-cream-200 px-5 py-2 text-sm text-cocoa-500">
              Reference: <strong className="text-cocoa-800">{orderNumber}</strong>
            </p>
          )}

          <div className="card mt-10 p-6 text-left">
            <h2 className="font-display text-lg text-cocoa-800">Common reasons this happens</h2>
            <ul className="mt-4 space-y-2.5">
              {REASONS.map((reason) => (
                <li key={reason} className="flex gap-2.5 text-sm text-cocoa-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel-400" aria-hidden="true" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/checkout" icon={FiRefreshCw}>
              Try again
            </Button>
            <Button to="/cart" variant="outline">
              Review my cart
            </Button>
          </div>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-sm text-cocoa-300">
            <FiMessageCircle />
            Still stuck?{' '}
            <Link to="/contact" className="font-semibold text-caramel-700 hover:underline">
              Talk to us
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default OrderFailed;
