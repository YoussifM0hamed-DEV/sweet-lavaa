import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowRight, FiCopy, FiCheck } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import useReveal from '../../hooks/useReveal.js';
import { IMAGE_URLS } from '../../utils/heroImages.js';

const OFFERS = [
  {
    code: 'SWEET10',
    headline: '10% off your first box',
    detail: 'On orders over 300 EGP. Our way of saying hello.',
    image: IMAGE_URLS.offerCake,
    tone: 'dark',
    to: '/products',
  },
  {
    code: 'GIFT100',
    headline: '100 EGP off gift boxes',
    detail: 'On gift orders over 1000 EGP. Ribbon and card included.',
    image: IMAGE_URLS.offerBox,
    tone: 'light',
    to: '/products?search=gift',
  },
];

const CouponCard = ({ offer }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      toast.success(`Code ${offer.code} copied.`);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Could not copy the code. Please write it down.');
    }
  };

  const isDark = offer.tone === 'dark';

  return (
    <article className="group relative overflow-hidden rounded-card shadow-soft transition-all duration-500 ease-smooth hover:shadow-lift">
      <div className="absolute inset-0">
        <SmartImage
          src={offer.image}
          alt=""
          width={900}
          className="h-full w-full"
          imgClassName="transition-transform duration-[900ms] ease-smooth group-hover:scale-105"
        />
        <div className={isDark ? 'absolute inset-0 bg-cocoa-900/70' : 'absolute inset-0 bg-cream-100/90'} />
      </div>

      <div className="relative flex min-h-[280px] flex-col justify-end p-7 sm:p-9">
        <p className={`eyebrow ${isDark ? 'text-caramel-300' : 'text-caramel-700'}`}>Sweet deal</p>

        <h3 className={`mt-3 font-display text-2xl leading-tight sm:text-3xl ${isDark ? 'text-cream-50' : 'text-cocoa-800'}`}>
          {offer.headline}
        </h3>
        <p className={`mt-2 max-w-sm text-sm ${isDark ? 'text-cream-200/75' : 'text-cocoa-400'}`}>{offer.detail}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className={`inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2.5 text-sm font-bold tracking-wider transition-colors ${
              isDark
                ? 'border-cream-300/40 text-cream-100 hover:bg-cream-100/10'
                : 'border-cocoa-300 text-cocoa-800 hover:bg-cocoa-800/5'
            }`}
            aria-label={`Copy coupon code ${offer.code}`}
          >
            {copied ? <FiCheck /> : <FiCopy />}
            {offer.code}
          </button>

          <Link
            to={offer.to}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              isDark ? 'text-cream-100 hover:text-caramel-300' : 'text-cocoa-700 hover:text-caramel-700'
            }`}
          >
            Shop now <FiArrowRight />
          </Link>
        </div>
      </div>
    </article>
  );
};

const SpecialOffers = () => {
  const ref = useReveal();

  return (
    <section className="section-tight">
      <div className="container-page">
        <div ref={ref} className="reveal grid gap-5 lg:grid-cols-2">
          {OFFERS.map((offer) => (
            <CouponCard key={offer.code} offer={offer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;
