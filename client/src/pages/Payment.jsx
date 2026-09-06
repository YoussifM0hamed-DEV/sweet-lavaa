import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock, FiArrowLeft, FiAlertTriangle, FiExternalLink } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { paymentService } from '../services/commerceService.js';
import { orderService } from '../services/commerceService.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { formatPrice } from '../utils/format.js';

/**
 * Opens a Fawaterak invoice and hands the customer over to the hosted payment
 * page. The browser never decides whether a payment succeeded — the server
 * re-reads the invoice from Fawaterak before anything is marked paid.
 */
const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [session, setSession] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef(null);
  const redirectRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const orderResponse = await orderService.getOne(orderId);
        if (cancelled) return;
        setOrder(orderResponse.data.order);

        if (orderResponse.data.order.payment.status === 'paid') {
          navigate(`/order-success?order=${orderResponse.data.order.orderNumber}`, { replace: true });
          return;
        }

        const response = await paymentService.initiate(orderId);
        if (cancelled) return;
        setSession(response.data);

        // Short pause so the customer sees what they are about to pay for.
        redirectRef.current = setTimeout(() => {
          window.location.href = response.data.paymentUrl;
        }, 1200);
      } catch (initError) {
        if (!cancelled) setError(initError.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    start();
    return () => {
      cancelled = true;
      clearTimeout(redirectRef.current);
    };
  }, [orderId, navigate]);

  /*
   * Covers the customer who comes back here with the browser's back button:
   * the webhook may already have settled the order while they were away.
   */
  useEffect(() => {
    if (!session) return undefined;

    pollRef.current = setInterval(async () => {
      try {
        const response = await paymentService.status(orderId);
        const { paymentStatus, orderNumber } = response.data;

        if (paymentStatus === 'paid') {
          clearInterval(pollRef.current);
          clearTimeout(redirectRef.current);
          toast.success('Payment received. Thank you!');
          navigate(`/order-success?order=${orderNumber}`, { replace: true });
        } else if (paymentStatus === 'failed') {
          clearInterval(pollRef.current);
          clearTimeout(redirectRef.current);
          navigate(`/order-failed?order=${orderNumber}`, { replace: true });
        }
      } catch {
        /* keep polling — a transient failure should not end the session */
      }
    }, 4000);

    return () => clearInterval(pollRef.current);
  }, [session, orderId, navigate]);

  return (
    <>
      <Seo title="Payment" noIndex />

      <div className="container-page section">
        <div className="mx-auto max-w-4xl">
          <Link to="/checkout" className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-400 hover:text-cocoa-800">
            <FiArrowLeft /> Back to checkout
          </Link>

          <div className="mt-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
              <FiLock /> Secure payment by Fawaterak
            </span>
            <h1 className="mt-5 text-display-sm">Complete your payment</h1>
            {order && (
              <p className="lede mt-2 text-base">
                Order <strong className="text-cocoa-700">{order.orderNumber}</strong> ·{' '}
                <strong className="text-cocoa-700">{formatPrice(order.pricing.total, currency)}</strong>
              </p>
            )}
          </div>

          <div className="card mt-8 overflow-hidden">
            {isLoading ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-cocoa-300">
                <Spinner size="lg" />
                <p className="text-sm">Opening a secure payment session…</p>
              </div>
            ) : error ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
                  <FiAlertTriangle />
                </span>
                <h2 className="mt-5 font-display text-xl text-cocoa-800">We could not start the payment</h2>
                <p className="mt-2 max-w-md text-sm text-cocoa-400">{error}</p>

                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => window.location.reload()}>Try again</Button>
                  <Button to="/account/orders" variant="outline">
                    View my orders
                  </Button>
                </div>

                <p className="mt-6 max-w-md text-xs leading-relaxed text-cocoa-300">
                  Your order has been saved. Nothing has been charged, and you can pay for it later from your orders
                  page.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <Spinner size="lg" />
                <h2 className="mt-6 font-display text-xl text-cocoa-800">Taking you to the payment page…</h2>
                <p className="mt-2 max-w-md text-sm text-cocoa-400">
                  You will finish paying on Fawaterak&apos;s secure page, then come straight back here.
                </p>

                {/* Fallback for a browser that blocks the automatic redirect. */}
                <a
                  href={session.paymentUrl}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cocoa-700"
                >
                  Continue to payment <FiExternalLink />
                </a>
              </div>
            )}
          </div>

          {!error && !isLoading && (
            <p className="mt-6 text-center text-xs leading-relaxed text-cocoa-300">
              Do not close this window while the payment is processing. We confirm the result with our payment provider
              before your order is marked as paid.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Payment;
