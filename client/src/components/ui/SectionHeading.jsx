import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import useReveal from '../../hooks/useReveal.js';

const SectionHeading = ({ eyebrow, title, description, linkTo, linkLabel, align = 'left' }) => {
  const ref = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal mb-10 flex flex-wrap items-end gap-6 ${
        align === 'center' ? 'flex-col justify-center text-center' : 'justify-between'
      }`}
    >
      <div className="max-w-xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-display-sm text-balance">{title}</h2>
        {description && <p className="lede mt-3">{description}</p>}
      </div>

      {linkTo && (
        <Link
          to={linkTo}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-cocoa-700 transition-colors hover:text-caramel-600"
        >
          {linkLabel || 'View all'}
          <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeading;
