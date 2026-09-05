import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';

/** Compact pagination with ellipses — always shows first, last and neighbours. */
const buildPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('…');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('…');
  pages.push(total);

  return pages;
};

const Pagination = ({ page, totalPages, onChange, className }) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  const buttonClass = (isActive) =>
    cn(
      'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all duration-200',
      isActive
        ? 'bg-cocoa-800 text-cream-100 shadow-soft'
        : 'text-cocoa-500 hover:bg-cream-200 hover:text-cocoa-800',
    );

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={cn(buttonClass(false), 'disabled:pointer-events-none disabled:opacity-35')}
        aria-label="Previous page"
      >
        <FiChevronLeft />
      </button>

      {pages.map((entry, index) =>
        entry === '…' ? (
          <span key={`gap-${index}`} className="px-1 text-cocoa-300">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            className={buttonClass(entry === page)}
            aria-current={entry === page ? 'page' : undefined}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(buttonClass(false), 'disabled:pointer-events-none disabled:opacity-35')}
        aria-label="Next page"
      >
        <FiChevronRight />
      </button>
    </nav>
  );
};

export default Pagination;
