import { cn } from '../../utils/cn.js';

const TONES = {
  sale: 'badge-sale',
  new: 'badge-new',
  best: 'badge-best',
  out: 'badge-out',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

const Badge = ({ tone = 'neutral', icon: Icon, children, className }) => (
  <span className={cn(TONES[tone] || TONES.neutral, className)}>
    {Icon && <Icon className="text-[0.9em]" aria-hidden="true" />}
    {children}
  </span>
);

export default Badge;
