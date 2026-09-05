import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SmartImage from '../components/ui/SmartImage.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { categoryService } from '../services/catalogService.js';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    categoryService
      .list()
      .then((response) => setCategories(response.data.categories))
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <Seo
        title="Categories"
        description="Cakes, cookies, cheesecakes, cupcakes, brownies, donuts, desserts, gift boxes and seasonal sweets."
      />

      <div className="bg-warm-gradient">
        <div className="container-page py-12 md:py-16">
          <PageHeader
            title="Shop by category"
            description="Everything we bake, sorted by the kind of craving it answers."
            breadcrumbs={[{ label: 'Categories' }]}
          />
        </div>
      </div>

      <div className="container-page section">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/3] w-full rounded-card" />
              ))
            : categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/categories/${category.slug}`}
                  className="group relative block overflow-hidden rounded-card shadow-soft transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:shadow-lift"
                >
                  <div className="aspect-[4/3] w-full">
                    <SmartImage
                      src={category.image?.url}
                      alt={category.image?.alt || category.name}
                      width={700}
                      className="h-full w-full"
                      imgClassName="transition-transform duration-[900ms] ease-smooth group-hover:scale-110"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/85 via-cocoa-900/25 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl text-cream-50">{category.name}</h2>
                        {category.tagline && <p className="mt-1 text-sm text-cream-200/75">{category.tagline}</p>}
                        {category.productsCount > 0 && (
                          <p className="mt-2 text-xs text-cream-300/60">
                            {category.productsCount} product{category.productsCount === 1 ? '' : 's'}
                          </p>
                        )}
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-50/15 text-cream-100 backdrop-blur transition-all duration-300 group-hover:bg-caramel-500">
                        <FiArrowUpRight />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </>
  );
};

export default Categories;
