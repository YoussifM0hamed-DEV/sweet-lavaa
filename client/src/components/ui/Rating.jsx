import { FiStar } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';

const SIZES = { xs: 'text-[0.7rem]', sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };

/** Read-only star rating with half-star precision via a clipped overlay. */
const Rating = ({ value = 0, count, size = 'sm', showValue = true, className }) => {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn('relative inline-flex', SIZES[size])} aria-hidden="true">
        <div className="flex gap-0.5 text-cocoa-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <FiStar key={index} />
          ))}
        </div>
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${(rating / 5) * 100}%` }}>
          <div className="flex gap-0.5 text-gold-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <FiStar key={index} fill="currentColor" />
            ))}
          </div>
        </div>
      </div>

      {showValue && (
        <span className={cn('font-semibold text-cocoa-500', SIZES[size])}>
          {rating.toFixed(1)}
          {count !== undefined && <span className="ml-1 font-normal text-cocoa-300">({count})</span>}
        </span>
      )}
      <span className="sr-only">{`Rated ${rating.toFixed(1)} out of 5${count !== undefined ? ` from ${count} reviews` : ''}`}</span>
    </div>
  );
};

/** Interactive variant used by the review form. */
export const RatingInput = ({ value, onChange, size = 'lg' }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        aria-label={`${star} star${star > 1 ? 's' : ''}`}
        className={cn(
          'rounded p-0.5 transition-transform duration-200 hover:scale-110',
          SIZES[size],
          star <= value ? 'text-gold-400' : 'text-cocoa-200 hover:text-gold-300',
        )}
      >
        <FiStar fill={star <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

export default Rating;
