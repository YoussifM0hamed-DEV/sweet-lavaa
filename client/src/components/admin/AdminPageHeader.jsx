/** Consistent title block for every admin screen. */
const AdminPageHeader = ({ title, description, children }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-display text-2xl text-cocoa-800 sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-cocoa-400">{description}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </header>
);

export default AdminPageHeader;
