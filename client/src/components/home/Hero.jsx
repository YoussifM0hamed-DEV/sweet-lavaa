import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar, FiTruck, FiAward } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import Button from '../ui/Button.jsx';
import { IMAGE_URLS } from '../../utils/heroImages.js';

const TRUST = [
  { icon: FiStar, value: '4.9', label: 'Average rating' },
  { icon: FiTruck, value: 'Same day', label: 'Cairo delivery' },
  { icon: FiAward, value: '30+', label: 'Handmade treats' },
];

/**
 * The first thing a visitor sees. The headline states the promise, the imagery
 * does the selling, and the primary CTA is never more than a thumb away.
 */
const Hero = () => (
  <section className="relative overflow-hidden bg-warm-gradient">
    {/* Soft decorative blooms, purely atmospheric. */}
    <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blush-200/40 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-caramel-200/40 blur-3xl" />

    <div className="container-page relative py-16 md:py-24 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-caramel-200 bg-cream-50/70 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-caramel-700 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-caramel-500" aria-hidden="true" />
            Baked fresh this morning
          </span>

          <h1 className="mt-6 text-display-xl text-balance">
            Warm centres.
            <br />
            <span className="text-caramel-600">Cold mornings.</span>
            <br />
            Delivered.
          </h1>

          <p className="lede mt-6 max-w-lg">
            Small-batch cakes, cookies and desserts made with real butter, Belgian chocolate and a great deal of
            patience. Order before 4 PM and it arrives today.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/products" size="lg" iconRight={FiArrowRight}>
              Shop now
            </Button>
            <Button to="/categories" variant="outline" size="lg">
              Explore categories
            </Button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-cream-400/70 pt-7">
            {TRUST.map((item) => (
              <div key={item.label}>
                <dt className="sr-only">{item.label}</dt>
                <dd>
                  <span className="flex items-center gap-1.5 font-display text-xl font-semibold text-cocoa-800">
                    <item.icon className="text-base text-caramel-500" aria-hidden="true" />
                    {item.value}
                  </span>
                  <span className="mt-0.5 block text-[0.72rem] uppercase tracking-wider text-cocoa-300">
                    {item.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Image composition — a hero shot with two supporting tiles. */}
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift sm:aspect-[5/6]">
            <SmartImage
              src={IMAGE_URLS.heroMain}
              alt="A chocolate lava cake with a molten centre"
              width={1000}
              eager
              className="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/45 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-cream-50/90 p-4 backdrop-blur-md">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-caramel-700">Signature</p>
              <p className="mt-1 font-display text-lg text-cocoa-800">Molten Chocolate Lava Cake</p>
              <Link
                to="/products"
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-cocoa-600 transition-colors hover:text-caramel-700"
              >
                From 350 EGP <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="absolute -left-4 top-10 hidden h-32 w-32 overflow-hidden rounded-2xl border-4 border-cream-100 shadow-lift lg:block xl:-left-10 xl:h-40 xl:w-40">
            <SmartImage src={IMAGE_URLS.heroSideOne} alt="Freshly baked cookies" width={400} className="h-full w-full" />
          </div>

          <div className="absolute -right-3 bottom-16 hidden h-28 w-28 overflow-hidden rounded-2xl border-4 border-cream-100 shadow-lift lg:block xl:-right-8 xl:h-36 xl:w-36">
            <SmartImage src={IMAGE_URLS.heroSideTwo} alt="A slice of cheesecake" width={400} className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
