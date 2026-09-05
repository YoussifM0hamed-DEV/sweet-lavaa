import ProductCard from './ProductCard.jsx';
import { ProductGridSkeleton } from '../ui/Skeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { FiPackage } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';

const ProductGrid = ({
  products = [],
  isLoading = false,
  skeletonCount = 8,
  onQuickView,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Try adjusting your filters or explore another category.',
  emptyAction,
  columns = 'default',
  className,
}) => {
  if (isLoading) return <ProductGridSkeleton count={skeletonCount} />;

  if (!products.length) {
    return (
      <EmptyState
        icon={FiPackage}
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyAction?.label}
        actionTo={emptyAction?.to}
      />
    );
  }

  const gridClass =
    columns === 'compact'
      ? 'grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4'
      : 'grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={cn(gridClass, className)}>
      {products.map((product, index) => (
        // Stagger the entrance so the grid resolves in a wave rather than all at once.
        <div
          key={product._id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
        >
          <ProductCard product={product} onQuickView={onQuickView} eager={index < 4} />
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
