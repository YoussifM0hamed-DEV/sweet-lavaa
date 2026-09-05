import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import Badge from '../ui/Badge.jsx';
import { cn } from '../../utils/cn.js';

const ProductGallery = ({ images = [], alt, badges = [] }) => {
  const [active, setActive] = useState(0);
  const gallery = images.length ? images : [{ url: '', _id: 'placeholder' }];
  const step = (direction) => setActive((current) => (current + direction + gallery.length) % gallery.length);

  return (
    <div className="space-y-4">
      <div className="group relative overflow-hidden rounded-3xl bg-cream-200">
        <SmartImage
          src={gallery[active]?.url}
          alt={alt}
          width={1200}
          eager
          className="aspect-square w-full"
          imgClassName="transition-transform duration-700 ease-smooth group-hover:scale-105"
        />

        {badges.length > 0 && (
          <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-2">
            {badges.map((badge) => (
              <Badge key={badge.label} tone={badge.tone}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream-50/90 text-cocoa-700 opacity-0 shadow-soft backdrop-blur transition-all duration-300 hover:bg-cream-50 group-hover:opacity-100"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream-50/90 text-cocoa-700 opacity-0 shadow-soft backdrop-blur transition-all duration-300 hover:bg-cream-50 group-hover:opacity-100"
            >
              <FiChevronRight />
            </button>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {gallery.map((image, index) => (
            <button
              key={image._id || index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active}
              className={cn(
                'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
                index === active ? 'border-cocoa-800' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <SmartImage src={image.url} alt={`${alt} view ${index + 1}`} width={200} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
