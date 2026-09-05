import { cn } from '../../utils/cn.js';

const SIZES = { xs: 'h-3 w-3 border', sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-9 w-9 border-[3px]' };

const Spinner = ({ size = 'md', className }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      'inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]',
      SIZES[size],
      className,
    )}
  />
);

export default Spinner;
