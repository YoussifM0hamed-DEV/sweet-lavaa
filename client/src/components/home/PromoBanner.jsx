import { FiArrowRight } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import Button from '../ui/Button.jsx';
import useReveal from '../../hooks/useReveal.js';
import { IMAGE_URLS } from '../../utils/heroImages.js';

/** Full-bleed seasonal banner between the product rails. */
const PromoBanner = () => {
  const ref = useReveal();

  return (
    <section className="section-tight">
      <div className="container-page">
        <div ref={ref} className="reveal relative overflow-hidden rounded-[2rem]">
          <SmartImage
            src={IMAGE_URLS.promoBanner}
            alt="An assortment of sweets packed in a gift box"
            width={1600}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cocoa-900/90 via-cocoa-900/70 to-cocoa-900/20" />

          <div className="relative px-7 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24">
            <div className="max-w-lg">
              <p className="eyebrow text-caramel-300">Gifting season</p>

              <h2 className="mt-4 font-display text-display-md text-cream-50 text-balance">
                Make every celebration sweeter
              </h2>

              <p className="mt-4 text-base leading-relaxed text-cream-200/80">
                Curated boxes in our signature cream and chocolate packaging, tied with ribbon and finished with a
                handwritten card. Tell us the message — we will write it by hand.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button to="/products?search=gift" variant="accent" size="lg" iconRight={FiArrowRight}>
                  Explore the collection
                </Button>
                <Button
                  to="/contact"
                  variant="outline"
                  size="lg"
                  className="border-cream-300/40 text-cream-100 hover:border-cream-100 hover:bg-cream-100 hover:text-cocoa-800"
                >
                  Corporate gifting
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
