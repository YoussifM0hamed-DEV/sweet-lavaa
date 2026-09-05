import { useState } from 'react';
import { cn } from '../../utils/cn.js';
import { optimizedImage } from '../../utils/product.js';

/**
 * Image with a branded gradient placeholder that covers both the loading state
 * and a failed request, so a broken URL never leaves a grey box on the page.
 */
const SmartImage = ({ src, alt = '', width = 800, className, imgClassName, children, eager = false }) => {
  const [status, setStatus] = useState(src ? 'loading' : 'error');

  return (
    <div className={cn('relative overflow-hidden bg-placeholder', className)}>
      {src && status !== 'error' && (
        <img
          src={optimizedImage(src, width)}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}

      {status !== 'loaded' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="select-none font-display text-2xl text-white/70">{alt?.[0]?.toUpperCase() || 'S'}</span>
        </div>
      )}

      {children}
    </div>
  );
};

export default SmartImage;
