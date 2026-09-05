import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import { cn } from '../../utils/cn.js';

/** Wordmark with a small lava-drip glyph; swaps to the uploaded logo when set. */
const Logo = ({ tone = 'dark', className, showTagline = false }) => {
  const { settings, storeName } = useSettings();
  const logoUrl = settings.store?.logo?.url;

  if (logoUrl) {
    return (
      <Link to="/" className={cn('inline-flex items-center', className)} aria-label={storeName}>
        <img src={logoUrl} alt={storeName} className="h-9 w-auto object-contain" />
      </Link>
    );
  }

  const [first, ...rest] = storeName.split(' ');

  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label={storeName}>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6',
          tone === 'light' ? 'bg-cream-100 text-cocoa-800' : 'bg-cocoa-800 text-cream-100',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 17c0-4.4 3.6-8 8-8s8 3.6 8 8H4z" fill="currentColor" opacity="0.9" />
          <circle cx="12" cy="6" r="2.4" fill="currentColor" opacity="0.55" />
          <rect x="3" y="17" width="18" height="2.6" rx="1.3" fill="currentColor" opacity="0.7" />
        </svg>
      </span>

      <span className="leading-none">
        <span
          className={cn(
            'block whitespace-nowrap font-display text-xl font-semibold tracking-tight',
            tone === 'light' ? 'text-cream-100' : 'text-cocoa-800',
          )}
        >
          {first}
          {rest.length > 0 && <span className="text-caramel-500"> {rest.join(' ')}</span>}
        </span>
        {/* The tagline is a nice-to-have; it never gets to squeeze the header on phones. */}
        {showTagline && (
          <span
            className={cn(
              'mt-0.5 hidden whitespace-nowrap text-[0.6rem] uppercase tracking-[0.28em] sm:block',
              tone === 'light' ? 'text-cream-300/70' : 'text-cocoa-300',
            )}
          >
            Bakery &amp; Sweets
          </span>
        )}
      </span>
    </Link>
  );
};

export default Logo;
