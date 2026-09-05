import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiUser, FiMapPin, FiCreditCard, FiCheck, FiTag, FiX, FiArrowRight, FiArrowLeft, FiAlertTriangle, FiTruck,
} from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Input, { Textarea, Select } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import SmartImage from '../components/ui/SmartImage.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { deliveryZoneService } from '../services/catalogService.js';
import { orderService } from '../services/commerceService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { formatPrice } from '../utils/format.js';
import { PAYMENT_METHOD_META } from '../utils/constants.js';
import { cn } from '../utils/cn.js';

const STEPS = [
  { id: 1, label: 'Your details', icon: FiUser },
  { id: 2, label: 'Delivery', icon: FiMapPin },
  { id: 3, label: 'Payment', icon: FiCreditCard },
];

const StepIndicator = ({ current }) => (
  <ol className="flex items-center gap-2 sm:gap-4">
    {STEPS.map((step, index) => {
      const isDone = current > step.id;
      const isActive = current === step.id;

      return (
        <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
              isDone
                ? 'bg-emerald-500 text-white'
                : isActive
                  ? 'bg-cocoa-800 text-cream-100 shadow-soft'
                  : 'bg-cream-300 text-cocoa-300',
            )}
          >
            {isDone ? <FiCheck /> : step.id}
          </span>
          <span
            className={cn(
              'hidden text-sm font-semibold sm:block',
              isActive ? 'text-cocoa-800' : isDone ? 'text-emerald-600' : 'text-cocoa-300',
            )}
          >
            {step.label}
          </span>
          {index < STEPS.length - 1 && (
            <span className={cn('h-px flex-1 transition-colors duration-500', isDone ? 'bg-emerald-400' : 'bg-cream-400')} />
          )}
        </li>
      );
    })}
  </ol>
);

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, itemsCount, isLoading: cartLoading, requestQuote, refresh } = useCart();
  const { currency, settings } = useSettings();

  const [step, setStep] = useState(1);
  const [zones, setZones] = useState([]);
  const [quote, setQuote] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    governorate: 'Cairo',
    city: '',
    district: '',
    street: '',
    building: '',
    apartment: '',
    floor: '',
    notes: '',
    deliveryZone: '',
    couponCode: '',
    paymentMethod: 'card',
    saveAddress: true,
  });

  /* Prefill from the profile and the default saved address. */
  useEffect(() => {
    if (!user) return;
    const address = user.addresses?.find((entry) => entry.isDefault) || user.addresses?.[0];

    setForm((current) => ({
      ...current,
      fullName: address?.fullName || user.fullName || '',
      email: user.email || '',
      phone: address?.phone || user.phone || '',
      governorate: address?.governorate || 'Cairo',
      city: address?.city || '',
      district: address?.district || '',
      street: address?.street || '',
      building: address?.building || '',
      apartment: address?.apartment || '',
      floor: address?.floor || '',
      deliveryZone: address?.deliveryZone || current.deliveryZone,
    }));
  }, [user]);

  useEffect(() => {
    deliveryZoneService
      .list()
      .then((response) => setZones(response.data.zones))
      .catch(() => toast.error('We could not load the delivery areas.'));
  }, []);

  /* Send the customer back to the cart if it empties out. */
  useEffect(() => {
    if (!cartLoading && items.length === 0) navigate('/cart', { replace: true });
  }, [cartLoading, items.length, navigate]);

  /**
   * Ask the server to price the order. Nothing about money is computed here —
   * the response is the single source of truth for what will be charged.
   */
  const fetchQuote = async ({ deliveryZone, couponCode } = {}) => {
    setIsQuoting(true);
    try {
      const result = await requestQuote({
        deliveryZone: deliveryZone ?? form.deliveryZone ?? undefined,
        couponCode: couponCode ?? form.couponCode ?? undefined,
      });
      setQuote(result);
      if (result.couponError) setCouponError(result.couponError);
      return result;
    } catch (error) {
      toast.error(error.message);
      return null;
    } finally {
      setIsQuoting(false);
    }
  };

  /**
   * First quote of the session. The cart may already carry a delivery zone and
   * coupon from a previous visit, so adopt them into the form — otherwise the
   * summary would show a fee for an area the form claims is unselected.
   */
  useEffect(() => {
    if (cartLoading || items.length === 0) return;

    fetchQuote().then((result) => {
      if (!result) return;
      setForm((current) => ({
        ...current,
        deliveryZone: current.deliveryZone || result.delivery?.zone || '',
        couponCode: current.couponCode || result.coupon?.code || '',
      }));
    });
    // Intentionally only on first load; zone and coupon changes re-quote explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLoading, items.length]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectedZone = useMemo(() => zones.find((zone) => zone._id === form.deliveryZone), [zones, form.deliveryZone]);

  const validateStep = (target) => {
    const found = {};

    if (target >= 1) {
      if (!form.fullName.trim() || form.fullName.trim().length < 2) found.fullName = 'Please enter your full name.';
      if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Please enter a valid email address.';
      if (!/^[+0-9][0-9\s-]{6,19}$/.test(form.phone)) found.phone = 'Please enter a valid phone number.';
    }

    if (target >= 2) {
      if (!form.deliveryZone) found.deliveryZone = 'Please choose a delivery area.';
      if (!form.street.trim() || form.street.trim().length < 2) found.street = 'Please enter your street address.';
    }

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const goToStep = async (target) => {
    if (target > step && !validateStep(target - 1)) return;
    if (target === 3) await fetchQuote();
    setStep(target);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponError('');
    const result = await fetchQuote({ couponCode: code });

    if (result?.coupon) {
      setField('couponCode', code);
      setCouponInput('');
      toast.success(`Coupon ${code} applied.`);
    } else {
      setCouponError(result?.couponError || 'This coupon could not be applied.');
      await fetchQuote({ couponCode: '' });
    }
  };

  const removeCoupon = async () => {
    setField('couponCode', '');
    setCouponError('');
    await fetchQuote({ couponCode: '' });
    toast.success('Coupon removed.');
  };

  const placeOrder = async () => {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    setIsPlacing(true);
    try {
      const response = await orderService.create({
        contact: { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() },
        shippingAddress: {
          governorate: form.governorate,
          city: form.city,
          district: form.district,
          street: form.street,
          building: form.building,
          apartment: form.apartment,
          floor: form.floor,
          notes: form.notes,
        },
        deliveryZone: form.deliveryZone,
        couponCode: form.couponCode || null,
        paymentMethod: form.paymentMethod,
        customerNotes: form.notes,
        saveAddress: form.saveAddress,
      });

      const { order, requiresPayment } = response.data;
      await refresh();

      if (requiresPayment) {
        navigate(`/payment/${order._id}`, { replace: true });
      } else {
        toast.success('Your order has been placed.');
        navigate(`/order-success?order=${order.orderNumber}`, { replace: true });
      }
    } catch (error) {
      const fieldErrors = error.toFieldMap?.() || {};
      setErrors(fieldErrors);
      toast.error(error.message);

      // Stock or coupon problems need a fresh quote before the customer retries.
      await fetchQuote();
    } finally {
      setIsPlacing(false);
    }
  };

  const pricing = quote?.pricing || { subtotal: 0, discount: 0, deliveryFee: 0, tax: 0, total: 0 };
  const issues = quote?.issues || [];
  const allowCod = settings.commerce?.allowCashOnDelivery !== false;

  return (
    <>
      <Seo title="Checkout" noIndex />

      <div className="container-page section">
        <PageHeader title="Checkout" breadcrumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

        <div className="mt-8 max-w-3xl">
          <StepIndicator current={step} />
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <div className="card p-6 sm:p-8">
            {/* ── Step 1: contact ─────────────────────────────────── */}
            {step === 1 && (
              <div className="animate-fade-up">
                <h2 className="font-display text-2xl text-cocoa-800">Who is this order for?</h2>
                <p className="mt-1.5 text-sm text-cocoa-400">We will use these details to confirm the delivery.</p>

                <div className="mt-7 space-y-5">
                  <Input
                    label="Full name"
                    required
                    value={form.fullName}
                    onChange={(event) => setField('fullName', event.target.value)}
                    error={errors.fullName || errors['contact.fullName']}
                    placeholder="Nour Hassan"
                    autoComplete="name"
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      error={errors.email || errors['contact.email']}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    <Input
                      label="Phone number"
                      required
                      value={form.phone}
                      onChange={(event) => setField('phone', event.target.value)}
                      error={errors.phone || errors['contact.phone']}
                      placeholder="01012345678"
                      autoComplete="tel"
                      hint="Our courier will call this number."
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={() => goToStep(2)} iconRight={FiArrowRight}>
                    Continue to delivery
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: delivery ────────────────────────────────── */}
            {step === 2 && (
              <div className="animate-fade-up">
                <h2 className="font-display text-2xl text-cocoa-800">Where should we deliver?</h2>
                <p className="mt-1.5 text-sm text-cocoa-400">
                  Choose your area first — the delivery fee is set by the area you pick.
                </p>

                <div className="mt-7">
                  <p className="label">Delivery area *</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {zones.map((zone) => {
                      const selected = form.deliveryZone === zone._id;
                      return (
                        <button
                          key={zone._id}
                          type="button"
                          onClick={async () => {
                            setField('deliveryZone', zone._id);
                            await fetchQuote({ deliveryZone: zone._id });
                          }}
                          aria-pressed={selected}
                          className={cn(
                            'rounded-xl border p-4 text-left transition-all duration-200',
                            selected
                              ? 'border-cocoa-800 bg-cocoa-800 text-cream-100 shadow-soft'
                              : 'border-cream-400 bg-cream-50 hover:border-cocoa-300',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{zone.name}</span>
                            <span className={cn('text-sm font-bold', selected ? 'text-caramel-300' : 'text-caramel-600')}>
                              {formatPrice(zone.deliveryFee, currency)}
                            </span>
                          </span>
                          <span className={cn('mt-1 block text-xs', selected ? 'text-cream-300/70' : 'text-cocoa-300')}>
                            {zone.estimatedTime}
                            {zone.freeDeliveryThreshold > 0 &&
                              ` · Free over ${formatPrice(zone.freeDeliveryThreshold, currency)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.deliveryZone && <p className="field-error">{errors.deliveryZone}</p>}
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Governorate"
                    value={form.governorate}
                    onChange={(event) => setField('governorate', event.target.value)}
                    placeholder="Cairo"
                  />
                  <Input
                    label="City"
                    value={form.city}
                    onChange={(event) => setField('city', event.target.value)}
                    placeholder="New Cairo"
                  />
                  <Input
                    label="District / compound"
                    value={form.district}
                    onChange={(event) => setField('district', event.target.value)}
                    placeholder="First Settlement"
                  />
                  <Input
                    label="Street"
                    required
                    value={form.street}
                    onChange={(event) => setField('street', event.target.value)}
                    error={errors.street || errors['shippingAddress.street']}
                    placeholder="90th Street"
                  />
                  <Input
                    label="Building"
                    value={form.building}
                    onChange={(event) => setField('building', event.target.value)}
                    placeholder="12"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Floor"
                      value={form.floor}
                      onChange={(event) => setField('floor', event.target.value)}
                      placeholder="3"
                    />
                    <Input
                      label="Apartment"
                      value={form.apartment}
                      onChange={(event) => setField('apartment', event.target.value)}
                      placeholder="7"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <Textarea
                    label="Delivery notes"
                    value={form.notes}
                    onChange={(event) => setField('notes', event.target.value)}
                    placeholder="Gate code, landmark, or a message to write on the card."
                    rows={3}
                  />
                </div>

                <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-500">
                  <input
                    type="checkbox"
                    checked={form.saveAddress}
                    onChange={(event) => setField('saveAddress', event.target.checked)}
                    className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
                  />
                  Save this address for next time
                </label>

                <div className="mt-8 flex flex-wrap justify-between gap-3">
                  <Button variant="ghost" onClick={() => goToStep(1)} icon={FiArrowLeft}>
                    Back
                  </Button>
                  <Button onClick={() => goToStep(3)} iconRight={FiArrowRight} isLoading={isQuoting}>
                    Review and pay
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: review and pay ──────────────────────────── */}
            {step === 3 && (
              <div className="animate-fade-up">
                <h2 className="font-display text-2xl text-cocoa-800">Review your order</h2>
                <p className="mt-1.5 text-sm text-cocoa-400">One last look before we start baking.</p>

                {issues.length > 0 && (
                  <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <FiAlertTriangle className="mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">Please review these items</p>
                      {issues.map((issue) => (
                        <p key={issue.product + issue.code}>{issue.message}</p>
                      ))}
                      <Link to="/cart" className="mt-1 inline-block font-semibold underline">
                        Go to cart
                      </Link>
                    </div>
                  </div>
                )}

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-xl bg-cream-200/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-cocoa-400">Contact</p>
                      <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-caramel-700 hover:underline">
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-cocoa-800">{form.fullName}</p>
                    <p className="text-sm text-cocoa-400">{form.email}</p>
                    <p className="text-sm text-cocoa-400">{form.phone}</p>
                  </div>

                  <div className="rounded-xl bg-cream-200/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-cocoa-400">Deliver to</p>
                      <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-caramel-700 hover:underline">
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-cocoa-800">{selectedZone?.name}</p>
                    <p className="text-sm leading-relaxed text-cocoa-400">
                      {[form.street, form.building && `Bldg ${form.building}`, form.apartment && `Apt ${form.apartment}`,
                        form.district, form.city].filter(Boolean).join(', ')}
                    </p>
                    {selectedZone && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-cocoa-300">
                        <FiTruck /> {selectedZone.estimatedTime}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-7">
                  <p className="label">Payment method</p>
                  <div className="space-y-2.5">
                    {['card', ...(allowCod ? ['cash_on_delivery'] : [])].map((method) => {
                      const meta = PAYMENT_METHOD_META[method];
                      const selected = form.paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setField('paymentMethod', method)}
                          aria-pressed={selected}
                          className={cn(
                            'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200',
                            selected ? 'border-cocoa-800 bg-cream-200/60 shadow-soft' : 'border-cream-400 hover:border-cocoa-300',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                              selected ? 'border-cocoa-800' : 'border-cocoa-200',
                            )}
                          >
                            {selected && <span className="h-2.5 w-2.5 rounded-full bg-cocoa-800" />}
                          </span>
                          <span>
                            <span className="block font-semibold text-cocoa-800">{meta.label}</span>
                            <span className="block text-xs text-cocoa-400">{meta.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-between gap-3">
                  <Button variant="ghost" onClick={() => goToStep(2)} icon={FiArrowLeft}>
                    Back
                  </Button>
                  <Button
                    onClick={placeOrder}
                    isLoading={isPlacing}
                    loadingText="Placing your order…"
                    size="lg"
                    disabled={issues.length > 0 || isQuoting}
                  >
                    {form.paymentMethod === 'cash_on_delivery'
                      ? 'Place order'
                      : `Pay ${formatPrice(pricing.total, currency)}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Order summary ─────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <div className="card p-6">
              <h2 className="font-display text-xl text-cocoa-800">Your order</h2>

              <ul className="mt-5 max-h-64 space-y-4 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li key={`${item.product}-${item.variant?.id || 'base'}`} className="flex gap-3">
                    <div className="relative shrink-0">
                      <SmartImage src={item.image} alt={item.name} width={140} className="h-16 w-16 rounded-lg" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cocoa-800 px-1 text-[0.65rem] font-bold text-cream-100">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-cocoa-700">{item.name}</p>
                      {item.variant?.name && <p className="text-xs text-cocoa-300">{item.variant.name}</p>}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-cocoa-800">
                      {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity, currency)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Coupon */}
              <div className="mt-5 border-t border-cream-300 pt-5">
                {quote?.coupon ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-emerald-700">
                      <FiTag className="shrink-0" />
                      <span className="truncate">{quote.coupon.code}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label="Remove coupon"
                      className="shrink-0 rounded-full p-1.5 text-emerald-700 hover:bg-emerald-100"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        aria-label="Coupon code"
                        className="input flex-1 uppercase tracking-wider"
                      />
                      <Button variant="outline" size="sm" onClick={applyCoupon} isLoading={isQuoting} disabled={!couponInput.trim()}>
                        Apply
                      </Button>
                    </div>
                    {couponError && <p className="field-error">{couponError}</p>}
                  </>
                )}
              </div>

              {/* Totals — every figure comes from the server quote. */}
              <div className="mt-5 space-y-2.5 border-t border-cream-300 pt-5 text-sm">
                <div className="flex justify-between text-cocoa-500">
                  <span>Subtotal ({itemsCount} item{itemsCount === 1 ? '' : 's'})</span>
                  <span className="font-semibold text-cocoa-800">{formatPrice(pricing.subtotal, currency)}</span>
                </div>

                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatPrice(pricing.discount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-cocoa-500">
                  <span>Delivery {selectedZone ? `(${selectedZone.name})` : ''}</span>
                  {form.deliveryZone ? (
                    quote?.delivery?.isFree ? (
                      <span className="font-semibold text-emerald-600">Free</span>
                    ) : (
                      <span className="font-semibold text-cocoa-800">{formatPrice(pricing.deliveryFee, currency)}</span>
                    )
                  ) : (
                    <span className="text-cocoa-300">Choose an area</span>
                  )}
                </div>

                {pricing.tax > 0 && (
                  <div className="flex justify-between text-cocoa-500">
                    <span>Tax</span>
                    <span className="font-semibold text-cocoa-800">{formatPrice(pricing.tax, currency)}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-baseline justify-between border-t border-cream-300 pt-5">
                <span className="font-display text-lg text-cocoa-800">Total</span>
                <span className="flex items-center gap-2 font-display text-2xl font-semibold text-cocoa-800">
                  {isQuoting && <Spinner size="sm" className="text-cocoa-300" />}
                  {formatPrice(pricing.total, currency)}
                </span>
              </div>

              <p className="mt-4 text-center text-xs leading-relaxed text-cocoa-300">
                Prices, discounts and delivery fees are confirmed by our server before payment.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Checkout;
