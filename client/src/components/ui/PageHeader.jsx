import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

/** Breadcrumb + title block used at the top of every secondary storefront page. */
const PageHeader = ({ title, description, breadcrumbs = [], align = 'left', children }) => (
  <header className={align === 'center' ? 'text-center' : ''}>
    {breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className={`flex flex-wrap items-center gap-1.5 text-xs text-cocoa-300 ${align === 'center' ? 'justify-center' : ''}`}>
          <li>
            <Link to="/" className="transition-colors hover:text-caramel-600">
              Home
            </Link>
          </li>
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.label} className="flex items-center gap-1.5">
              <FiChevronRight className="text-[0.9em]" aria-hidden="true" />
              {crumb.to && index < breadcrumbs.length - 1 ? (
                <Link to={crumb.to} className="transition-colors hover:text-caramel-600">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-cocoa-500" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    )}

    {/* A breadcrumb-only header passes no title, so we never emit an empty h1. */}
    {(title || description || children) && (
      <div className={`flex flex-wrap items-end gap-4 ${align === 'center' ? 'justify-center' : 'justify-between'}`}>
        <div className="max-w-2xl">
          {title && <h1 className="text-display-md">{title}</h1>}
          {description && <p className="lede mt-3">{description}</p>}
        </div>
        {children}
      </div>
    )}
  </header>
);

export default PageHeader;
