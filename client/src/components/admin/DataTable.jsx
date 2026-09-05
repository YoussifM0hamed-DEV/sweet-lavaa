import { TableSkeleton } from '../ui/Skeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { FiInbox } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';

/**
 * Responsive table: a real table on desktop, stacked cards on mobile so rows
 * stay readable rather than scrolling sideways.
 */
const DataTable = ({
  columns,
  rows,
  isLoading,
  rowKey = (row) => row._id,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyAction,
  skeletonRows = 6,
}) => {
  if (isLoading) {
    return (
      <div className="card p-5">
        <TableSkeleton rows={skeletonRows} columns={Math.min(columns.length, 5)} />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="card">
        <EmptyState
          icon={FiInbox}
          title={emptyTitle}
          message={emptyMessage}
          actionLabel={emptyAction?.label}
          actionTo={emptyAction?.to}
          onAction={emptyAction?.onClick}
        />
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="card hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-100/60">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-cocoa-400',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.className,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-300">
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-cream-100/70')}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-5 py-4 align-middle text-cocoa-600',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        column.cellClassName,
                      )}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn('card p-4', onRowClick && 'cursor-pointer active:scale-[0.99]')}
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-3 py-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cocoa-300">{column.header}</span>
                  <span className="text-right text-sm text-cocoa-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default DataTable;
