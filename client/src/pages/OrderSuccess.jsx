import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiTruck, FiArrowRight } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import Button from '../components/ui/Button.jsx';
import { orderService } from '../services/commerceService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { formatPrice } from '../utils/format.js';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { isAuthenticated } = useAuth();
  const { currency } = useSettings();

  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderNumber || !isAuthenticated) return;
    orderService
      .track(orderNumber)
      .then((response) => setOrder(response.data.order))
      .catch(() => setOrder(null));
  }, [orderNumber, isAuthenticated]);

  return (
    <>
      <Seo title="Order confirmed" noIndex />

      <div className="container-page section">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
            <FiCheckCircle />
          </span>

          <h1 className="mt-7 text-display-md">Thank you — your order is in</h1>
          <p className="lede mt-4">
            We have started on it already. You will get a confirmation by email, and our courier will call before
            arriving.
          </p>

          {orderNumber && (
            <div className="mt-8 inline-block rounded-2xl bg-cream-200 px-7 py-5">
              <p className="text-xs uppercase tracking-widest text-cocoa-400">Order number</p>
              <p className="mt-1 font-display text-2xl font-semibold text-cocoa-800">{orderNumber}</p>
              {order && (
                <p className="mt-1.5 text-sm text-cocoa-400">
                  {formatPrice(order.pricing.total, currency)} · {order.deliveryZone?.name}
                </p>
              )}
            </div>
          )}

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            {[
              { icon: FiCheckCircle, title: 'Confirmed', detail: 'We have your order and payment details.' },
              { icon: FiPackage, title: 'Being prepared', detail: 'Baked fresh, then packed by hand.' },
              { icon: FiTruck, title: 'On its way', detail: order?.deliveryZone?.estimatedTime || 'Delivered to your door.' },
            ].map((step, index) => (
              <div key={step.title} className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-caramel-100 text-caramel-600">
                  <step.icon />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-cocoa-300">Step {index + 1}</p>
                <p className="mt-0.5 font-semibold text-cocoa-800">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-cocoa-400">{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {isAuthenticated && (
              <Button to="/account/orders" iconRight={FiArrowRight}>
                Track my order
              </Button>
            )}
            <Button to="/products" variant="outline">
              Continue shopping
            </Button>
          </div>

          <p className="mt-8 text-sm text-cocoa-300">
            Questions about this order?{' '}
            <Link to="/contact" className="font-semibold text-caramel-700 hover:underline">
              Get in touch
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
