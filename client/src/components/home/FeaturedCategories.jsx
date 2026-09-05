import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import useReveal from '../../hooks/useReveal.js';

const CategoryCard = ({ category, index }) => (
  <Link
    to={`/categories/${category.slug}`}
    className="group relative block overflow-hidden rounded-card shadow-soft transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:shadow-lift"
    // The first tile spans two columns on wide screens for visual rhythm.
    style={{ transitionDelay: `${index * 30}ms` }}
  >
    <div className="aspect-[4/5] w-full sm:aspect-[3/4]">
      <SmartImage
        src={category.image?.url}
        alt={category.image?.alt || category.name}
        width={600}
        className="h-full w-full"
        imgClassName="transition-transform duration-[900ms] ease-smooth group-hover:scale-110"
      />
    </div>

    <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/80 via-cocoa-900/15 to-transparent" />

    <div className="absolute inset-x-0 bottom-0 p-5">
      <h3 className="font-display text-xl text-cream-50">{category.name}</h3>
      {category.tagline && <p className="mt-1 text-xs text-cream-200/75">{category.tagline}</p>}

      <span className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-cream-100 opacity-0 transition-all duration-400 group-hover:opacity-100">
        Shop {category.name}
        <FiArrowUpRight className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </div>

    {category.productsCount > 0 && (
      <span className="absolute right-4 top-4 rounded-full bg-cream-50/90 px-2.5 py-1 text-[0.68rem] font-bold text-cocoa-700 backdrop-blur">
        {category.productsCount}
      </span>
    )}
  </Link>
);

const FeaturedCategories = ({ categories = [], isLoading }) => {
  const ref = useReveal();

  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Browse the counter"
          title="Find your kind of sweet"
          description="Nine categories, each made in small batches. Start where your craving is."
          linkTo="/categories"
          linkLabel="All categories"
        />

        <div ref={ref} className="reveal grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4] w-full rounded-card" />
              ))
            : categories.slice(0, 6).map((category, index) => (
                <CategoryCard key={category._id} category={category} index={index} />
              ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
