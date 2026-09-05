import Button from './Button.jsx';
import { cn } from '../../utils/cn.js';

/** Every empty list in the app renders through this so the tone stays consistent. */
const EmptyState = ({ icon: Icon, title, message, actionLabel, actionTo, onAction, secondary, className }) => (
  <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
    {Icon && (
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-2xl text-caramel-500">
        <Icon />
      </div>
    )}
    <h3 className="font-display text-xl text-cocoa-800">{title}</h3>
    {message && <p className="mt-2 max-w-sm text-sm leading-relaxed text-cocoa-400">{message}</p>}

    {(actionLabel || secondary) && (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {actionLabel && (
          <Button to={actionTo} onClick={onAction} variant="primary" size="sm">
            {actionLabel}
          </Button>
        )}
        {secondary}
      </div>
    )}
  </div>
);

export default EmptyState;
