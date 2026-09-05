import { useEffect, useState } from 'react';
import Seo from '../components/ui/Seo.jsx';
import Hero from '../components/home/Hero.jsx';
import FeaturedCategories from '../components/home/FeaturedCategories.jsx';
import SpecialOffers from '../components/home/SpecialOffers.jsx';
import WhyChooseUs from '../components/home/WhyChooseUs.jsx';
import PromoBanner from '../components/home/PromoBanner.jsx';
import Testimonials from '../components/home/Testimonials.jsx';
import NewsletterSection from '../components/home/NewsletterSection.jsx';
import ProductCarousel from '../components/product/ProductCarousel.jsx';
import QuickViewModal from '../components/product/QuickViewModal.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { productService, categoryService } from '../services/catalogService.js';
import useRecentlyViewed from '../hooks/useRecentlyViewed.js';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);

  const { ids: recentIds } = useRecentlyViewed();

  useEffect(() => {
    let cancelled = false;

    // One pass for everything above the fold; a failure in one section must
    // not blank out the others.
    Promise.allSettled([
      categoryService.list({ featured: 'true' }),
      productService.collection('bestsellers', 8),
      productService.collection('new', 8),
    ])
      .then(([categoriesResult, bestSellersResult, newArrivalsResult]) => {
        if (cancelled) return;
        if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value.data.categories);
        if (bestSellersResult.status === 'fulfilled') setBestSellers(bestSellersResult.value.data.products);
        if (newArrivalsResult.status === 'fulfilled') setNewArrivals(newArrivalsResult.value.data.products);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!recentIds.length) return;
    productService
      .recentlyViewed(recentIds)
      .then((response) => setRecentProducts(response.data.products))
      .catch(() => setRecentProducts([]));
  }, [recentIds]);

  return (
    <>
      <Seo
        title={null}
        description="Order premium cakes, cookies, cheesecakes, brownies and gift boxes from Sweet Lava. Baked fresh every morning and delivered across Cairo."
      />

      <Hero />

      <FeaturedCategories categories={categories} isLoading={isLoading} />

      <section className="section-tight">
        <div className="container-page">
          <SectionHeading
            eyebrow="Most loved"
            title="Our best sellers"
            description="The ones people come back for, ranked by what actually leaves the kitchen."
            linkTo="/products?bestSeller=true"
            linkLabel="Shop best sellers"
          />
          <ProductCarousel products={bestSellers} isLoading={isLoading} onQuickView={setQuickView} />
        </div>
      </section>

      <SpecialOffers />

      <WhyChooseUs />

      {newArrivals.length > 0 && (
        <section className="section-tight">
          <div className="container-page">
            <SectionHeading
              eyebrow="Fresh from the kitchen"
              title="New arrivals"
              description="Recipes we have been testing for weeks and are finally happy with."
              linkTo="/products?newArrival=true"
              linkLabel="See what is new"
            />
            <ProductCarousel products={newArrivals} onQuickView={setQuickView} />
          </div>
        </section>
      )}

      <PromoBanner />

      {recentProducts.length > 0 && (
        <section className="section-tight">
          <div className="container-page">
            <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
            <ProductCarousel products={recentProducts} onQuickView={setQuickView} />
          </div>
        </section>
      )}

      <Testimonials />

      <NewsletterSection />

      <QuickViewModal product={quickView} isOpen={Boolean(quickView)} onClose={() => setQuickView(null)} />
    </>
  );
};

export default Home;
