import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

const Modal = ({ isOpen, onClose, title, description, size = 'md', children, footer, className }) => {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-cocoa-900/50 backdrop-blur-sm"
      />

      <div
        className={cn(
          'relative w-full animate-scale-in overflow-hidden rounded-t-3xl bg-cream-50 shadow-lift sm:rounded-3xl',
          SIZES[size],
          className,
        )}
      >
        {(title || onClose) && (
          <header className="flex items-start justify-between gap-4 border-b border-cream-300 px-6 py-5">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-semibold text-cocoa-800">{title}</h2>}
              {description && <p className="mt-1 text-sm text-cocoa-400">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
              aria-label="Close"
            >
              <FiX className="text-lg" />
            </button>
          </header>
        )}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer && <footer className="border-t border-cream-300 bg-cream-100/60 px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
