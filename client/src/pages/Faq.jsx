import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { cn } from '../utils/cn.js';

const FAQ_GROUPS = [
  {
    category: 'Ordering',
    items: [
      {
        q: 'How far in advance should I order?',
        a: 'Most items on the menu can be ordered the same day if you check out before 4 PM. Custom celebration cakes need 48 hours, and corporate boxes need five working days.',
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'You can cancel from your orders page while the order is still Pending or Confirmed. Once we start preparing it, call us and we will do what we can.',
      },
      {
        q: 'Is there a minimum order value?',
        a: 'Yes — the minimum order is shown at checkout, and some delivery areas have their own minimum. You will always see the exact figure before you pay.',
      },
      {
        q: 'Can I write a message on the cake or card?',
        a: 'Absolutely. Add it in the delivery notes field at checkout and we will write it by hand.',
      },
    ],
  },
  {
    category: 'Delivery',
    items: [
      {
        q: 'Which areas do you deliver to?',
        a: 'New Cairo, Madinaty, Tagamoa, El Rehab, El Shorouk, Badr, Mostakbal City, Obour, Nasr City and Heliopolis. The full list with fees appears at checkout.',
      },
      {
        q: 'How much is delivery?',
        a: 'It depends on the area, typically between 45 and 80 EGP. Most areas ship free above a threshold, which is shown next to each area at checkout.',
      },
      {
        q: 'When will my order arrive?',
        a: 'Same day for orders placed before 4 PM in our closest areas, and one to three days elsewhere. The estimate for your area is shown before you pay.',
      },
      {
        q: 'Will the courier call me?',
        a: 'Yes. Our courier calls the number on the order before arriving, so please make sure it is one you will answer.',
      },
    ],
  },
  {
    category: 'Payment',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'Card and mobile wallet payments through Paymob, plus cash on delivery where available. We never see or store your card details.',
      },
      {
        q: 'My payment failed but I was charged. What now?',
        a: 'Failed payments are not captured, so any hold on your card is released by your bank, usually within a few days. If it persists, contact us with your order reference.',
      },
      {
        q: 'How do I use a coupon code?',
        a: 'Enter it in the coupon field in your cart or at checkout. The discount is validated and applied by our server, so the total you see is the total you pay.',
      },
    ],
  },
  {
    category: 'Products & allergens',
    items: [
      {
        q: 'Do you cater for allergies?',
        a: 'Every product page lists its allergens. Our kitchen handles gluten, dairy, eggs, nuts and soy, so we cannot guarantee any item is free from traces of them.',
      },
      {
        q: 'How should I store my order?',
        a: 'Keep everything refrigerated and enjoy within three days. Bring cakes and cheesecakes to room temperature for about twenty minutes before serving.',
      },
      {
        q: 'Do you offer sugar-free or vegan options?',
        a: 'Not on the standing menu yet. Contact us for larger orders and we will tell you what is possible.',
      },
    ],
  },
];

const FaqItem = ({ item, isOpen, onToggle }) => (
  <div className="border-b border-cream-300 last:border-b-0">
    <h3>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-base text-cocoa-800 sm:text-lg">{item.q}</span>
        <FiChevronDown
          className={cn('mt-1 shrink-0 text-cocoa-300 transition-transform duration-300', isOpen && 'rotate-180')}
        />
      </button>
    </h3>
    {isOpen && <p className="animate-fade-in pb-5 pr-8 text-sm leading-relaxed text-cocoa-400">{item.a}</p>}
  </div>
);

const Faq = () => {
  const [openKey, setOpenKey] = useState('Ordering-0');
  const [query, setQuery] = useState('');

  const term = query.trim().toLowerCase();
  const groups = FAQ_GROUPS.map((group) => ({
    ...group,
    items: term
      ? group.items.filter((item) => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term))
      : group.items,
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <Seo
        title="FAQ"
        description="Answers about ordering, delivery areas and fees, payment, allergens and storage at Sweet Lava."
      />

      <div className="bg-warm-gradient">
        <div className="container-page py-12 md:py-16">
          <PageHeader
            title="Frequently asked questions"
            description="Everything customers ask us most, in one place."
            breadcrumbs={[{ label: 'FAQ' }]}
          />
        </div>
      </div>

      <div className="container-page section">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-300" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the FAQ"
              aria-label="Search frequently asked questions"
              className="input pl-11"
            />
          </div>

          {groups.length === 0 ? (
            <p className="mt-12 text-center text-sm text-cocoa-300">
              No answers matched that. Try another word, or{' '}
              <Link to="/contact" className="font-semibold text-caramel-700 hover:underline">
                ask us directly
              </Link>
              .
            </p>
          ) : (
            <div className="mt-10 space-y-10">
              {groups.map((group) => (
                <section key={group.category}>
                  <h2 className="eyebrow mb-2">{group.category}</h2>
                  <div className="card px-6">
                    {group.items.map((item, index) => {
                      const key = `${group.category}-${index}`;
                      return (
                        <FaqItem
                          key={key}
                          item={item}
                          isOpen={openKey === key}
                          onToggle={() => setOpenKey(openKey === key ? null : key)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="mt-14 rounded-[2rem] bg-cocoa-gradient p-8 text-center sm:p-12">
            <h2 className="font-display text-2xl text-cream-50">Still have a question?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-200/70">
              Our team replies within one business day, and faster during opening hours.
            </p>
            <Button to="/contact" variant="accent" className="mt-7">
              Contact us
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Faq;
