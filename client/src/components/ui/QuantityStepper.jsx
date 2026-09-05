import { FiMinus, FiPlus } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';

const QuantityStepper = ({ value, onChange, min = 1, max = 99, disabled = false, size = 'md', className }) => {
  const isSmall = size === 'sm';

  const buttonClass = cn(
    'flex items-center justify-center rounded-full text-cocoa-600 transition-colors duration-200',
    'hover:bg-cream-300 disabled:pointer-events-none disabled:opacity-35',
    isSmall ? 'h-7 w-7' : 'h-9 w-9',
  );

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-cream-400 bg-cream-100 p-1',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={buttonClass}
        aria-label="Decrease quantity"
      >
        <FiMinus className={isSmall ? 'text-xs' : 'text-sm'} />
      </button>

      <span
        className={cn('min-w-8 text-center font-semibold tabular-nums text-cocoa-800', isSmall ? 'text-sm' : 'text-base')}
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={buttonClass}
        aria-label="Increase quantity"
      >
        <FiPlus className={isSmall ? 'text-xs' : 'text-sm'} />
      </button>
    </div>
  );
};

export default QuantityStepper;
