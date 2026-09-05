import { cn } from '../../utils/cn.js';

/** Underlined tab bar used on product details and account pages. */
const Tabs = ({ tabs, active, onChange, className }) => (
  <div className={cn('flex gap-1 overflow-x-auto border-b border-cream-300 no-scrollbar', className)} role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        role="tab"
        aria-selected={active === tab.value}
        onClick={() => onChange(tab.value)}
        className={cn(
          'relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors duration-200',
          active === tab.value ? 'text-cocoa-800' : 'text-cocoa-300 hover:text-cocoa-600',
        )}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className="ml-1.5 rounded-full bg-cream-300 px-1.5 py-0.5 text-[0.7rem] text-cocoa-500">{tab.count}</span>
        )}
        {active === tab.value && (
          <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-caramel-500" aria-hidden="true" />
        )}
      </button>
    ))}
  </div>
);

export default Tabs;
