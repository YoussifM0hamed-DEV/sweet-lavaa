import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { Skeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';

const TONES = {
  caramel: 'bg-caramel-100 text-caramel-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  sky: 'bg-sky-100 text-sky-600',
  blush: 'bg-blush-100 text-blush-400',
  amber: 'bg-amber-100 text-amber-600',
  cocoa: 'bg-cocoa-100 text-cocoa-600',
};

const StatCard = ({ icon: Icon, label, value, change, hint, tone = 'caramel', isLoading, to }) => {
  if (isLoading) return <Skeleton className="h-32 rounded-card" />;

  const isUp = change > 0;
  const isDown = change < 0;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-lg', TONES[tone])}>
          <Icon />
        </span>

        {change !== undefined && change !== null && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold',
              isUp ? 'bg-emerald-50 text-emerald-600' : isDown ? 'bg-red-50 text-red-600' : 'bg-cream-200 text-cocoa-400',
            )}
          >
            {isUp ? <FiTrendingUp /> : isDown ? <FiTrendingDown /> : null}
            {Math.abs(change)}%
          </span>
        )}
      </div>

      <p className="mt-4 font-display text-2xl font-semibold text-cocoa-800 sm:text-[1.75rem]">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-cocoa-300">{label}</p>
      {hint && <p className="mt-2 text-xs text-cocoa-400">{hint}</p>}
    </>
  );

  const className = cn('card p-5 transition-all duration-300', to && 'hover:-translate-y-0.5 hover:shadow-lift');

  if (to) {
    return (
      <a href={to} className={className}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
};

export default StatCard;
