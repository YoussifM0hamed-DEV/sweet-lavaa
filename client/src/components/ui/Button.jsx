import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';
import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

/**
 * One button for the whole app. Renders as <button>, <Link> or <a> depending on
 * the props, and shows a spinner (while staying the same width) when loading.
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  as,
  to,
  href,
  isLoading = false,
  loadingText,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const classes = cn(VARIANTS[variant] || VARIANTS.primary, SIZES[size], fullWidth && 'w-full', className);

  const content = (
    <>
      {isLoading ? <Spinner size="sm" /> : Icon ? <Icon className="text-[1.05em]" aria-hidden="true" /> : null}
      <span>{isLoading && loadingText ? loadingText : children}</span>
      {!isLoading && IconRight ? <IconRight className="text-[1.05em]" aria-hidden="true" /> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  const Component = as || 'button';

  return (
    <Component className={classes} disabled={disabled || isLoading} {...props}>
      {content}
    </Component>
  );
};

export default Button;
