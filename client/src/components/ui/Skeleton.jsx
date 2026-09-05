import { cn } from '../../utils/cn.js';

export const Skeleton = ({ className }) => <div className={cn('skeleton rounded-lg', className)} />;

export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="card overflow-hidden">
    <Skeleton className="aspect-[4/5] w-full rounded-none" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-full" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 6, columns = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4">
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <Skeleton key={columnIndex} className={cn('h-10', columnIndex === 0 ? 'w-1/3' : 'flex-1')} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
