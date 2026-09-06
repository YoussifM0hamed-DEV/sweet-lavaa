import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiInstagram, FiFacebook, FiYoutube, FiPhone, FiMail, FiMapPin, FiClock, FiArrowRight,
} from 'react-icons/fi';
import Logo from './Logo.jsx';
import Spinner from '../ui/Spinner.jsx';
import { miscService } from '../../services/catalogService.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const SHOP_LINKS = [
  { to: '/products', label: 'All products' },
  { to: '/categories', label: 'Categories' },
  { to: '/products?bestSeller=true', label: 'Best sellers' },
  { to: '/products?newArrival=true', label: 'New arrivals' },
  { to: '/products?onSale=true', label: 'Special offers' },
];

const HELP_LINKS = [
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
  { to: '/terms', label: 'Terms & conditions' },
  { to: '/privacy', label: 'Privacy policy' },
];

const FooterNewsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await miscService.subscribe(email.trim(), 'footer');
      toast.success(response.message);
      setEmail('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5">
      <label htmlFor="footer-newsletter" className="sr-only">
        Email address
      </label>
      <div className="flex items-center gap-2 rounded-full border border-cocoa-600 bg-cocoa-700/50 p-1.5 focus-within:border-caramel-400">
        <input
          id="footer-newsletter"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-cream-100 outline-none placeholder:text-cream-300/40"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Subscribe"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-caramel-500 text-white transition-colors hover:bg-caramel-400 disabled:opacity-60"
        >
          {isSubmitting ? <Spinner size="xs" /> : <FiArrowRight />}
        </button>
      </div>
    </form>
  );
};

const Footer = () => {
  const { settings, storeName } = useSettings();

  const socials = [
    { key: 'instagram', icon: FiInstagram, url: settings.social?.instagram, label: 'Instagram' },
    { key: 'facebook', icon: FiFacebook, url: settings.social?.facebook, label: 'Facebook' },
    { key: 'youtube', icon: FiYoutube, url: settings.social?.youtube, label: 'YouTube' },
  ].filter((entry) => entry.url);

  return (
    <footer className="bg-cocoa-gradient text-cream-200">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo tone="light" showTagline />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-300/70">
              {settings.store?.description ||
                'Handcrafted cakes, cookies and desserts baked fresh every morning and delivered across Cairo.'}
            </p>

            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map((social) => (
                  <a
                    key={social.key}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-cocoa-600 text-cream-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-caramel-400 hover:bg-caramel-500 hover:text-white"
                  >
                    <social.icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-label="Shop">
            <h3 className="font-display text-base text-cream-100">Shop</h3>
            <ul className="mt-4 space-y-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream-300/70 transition-colors hover:text-caramel-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Help">
            <h3 className="font-display text-base text-cream-100">Help</h3>
            <ul className="mt-4 space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream-300/70 transition-colors hover:text-caramel-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-display text-base text-cream-100">Stay in touch</h3>
            <ul className="mt-4 space-y-3 text-sm text-cream-300/70">
              {settings.contact?.address && (
                <li className="flex gap-3">
                  <FiMapPin className="mt-0.5 shrink-0 text-caramel-400" />
                  <span>{settings.contact.address}</span>
                </li>
              )}
              {settings.contact?.phone && (
                <li className="flex gap-3">
                  <FiPhone className="mt-0.5 shrink-0 text-caramel-400" />
                  <a href={`tel:${settings.contact.phone}`} className="transition-colors hover:text-caramel-300">
                    {settings.contact.phone}
                  </a>
                </li>
              )}
              {settings.contact?.email && (
                <li className="flex gap-3">
                  <FiMail className="mt-0.5 shrink-0 text-caramel-400" />
                  <a href={`mailto:${settings.contact.email}`} className="transition-colors hover:text-caramel-300">
                    {settings.contact.email}
                  </a>
                </li>
              )}
              {settings.contact?.workingHours && (
                <li className="flex gap-3">
                  <FiClock className="mt-0.5 shrink-0 text-caramel-400" />
                  <span>{settings.contact.workingHours}</span>
                </li>
              )}
            </ul>

            <FooterNewsletter />
          </div>
        </div>
      </div>

      <div className="border-t border-cocoa-600/60">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream-300/50 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            Baked with care in Cairo <span aria-hidden="true">·</span> Cash on delivery across Egypt
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
