import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSearch } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import { adminProductService, adminCategoryService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice } from '../../utils/format.js';
import { finalPrice, hasDiscount, discountPercent, productImage, stockStatus } from '../../utils/product.js';
import useDebounce from '../../hooks/useDebounce.js';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'stock-asc', label: 'Lowest stock' },
  { value: 'sold-desc', label: 'Best selling' },
];

const STOCK_META = {
  in_stock: { tone: 'success', label: 'In stock' },
  low_stock: { tone: 'warning', label: 'Low stock' },
  out_of_stock: { tone: 'danger', label: 'Out of stock' },
};

const Products = () => {
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState({ search: '', category: '', status: '', stock: '', sort: 'newest', page: 1 });
  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => {
    adminCategoryService
      .list()
      .then((response) => setCategories(response.data.categories))
      .catch(() => setCategories([]));
  }, []);

  const load = () => {
    setIsLoading(true);
    adminProductService
      .list({ ...filters, search: debouncedSearch, limit: 15 })
      .then((response) => {
        setProducts(response.data.products);
        setMeta(response.meta);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [debouncedSearch, filters.category, filters.status, filters.stock, filters.sort, filters.page]);

  const setFilter = (changes) => setFilters((current) => ({ ...current, ...changes, page: changes.page ?? 1 }));

  const toggleStatus = async (product) => {
    try {
      const response = await adminProductService.toggleStatus(product._id);
      toast.success(response.message);
      setProducts((current) =>
        current.map((entry) => (entry._id === product._id ? { ...entry, isActive: !entry.isActive } : entry)),
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async () => {
    setIsDeleting(true);
    try {
      await adminProductService.remove(deleteTarget._id);
      toast.success('Product deleted.');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (product) => (
        <div className="flex items-center gap-3">
          <SmartImage
            src={productImage(product)}
            alt={product.name}
            width={120}
            className="h-12 w-12 shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-cocoa-800">{product.name}</p>
            <p className="truncate text-xs text-cocoa-300">{product.sku || product.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (product) => <span className="text-cocoa-500">{product.category?.name || '—'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (product) => (
        <div>
          <span className="font-semibold text-cocoa-800">{formatPrice(finalPrice(product), currency)}</span>
          {hasDiscount(product) && (
            <span className="ml-2 text-xs text-cocoa-300 line-through">{formatPrice(product.price, currency)}</span>
          )}
          {hasDiscount(product) && <Badge tone="sale" className="ml-1">-{discountPercent(product)}%</Badge>}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product) => {
        const meta = STOCK_META[stockStatus(product)];
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-cocoa-700">{product.trackInventory ? product.stock : '∞'}</span>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
        );
      },
    },
    {
      key: 'sold',
      header: 'Sold',
      hideOnMobile: true,
      render: (product) => <span className="text-cocoa-500">{product.soldCount || 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => (
        <Badge tone={product.isActive ? 'success' : 'neutral'}>{product.isActive ? 'Live' : 'Hidden'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (product) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleStatus(product);
            }}
            aria-label={product.isActive ? 'Hide product' : 'Show product'}
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            {product.isActive ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
          </button>
          <Link
            to={`/admin/products/${product._id}/edit`}
            onClick={(event) => event.stopPropagation()}
            aria-label="Edit product"
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
          >
            <FiEdit2 className="text-sm" />
          </Link>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(product);
            }}
            aria-label="Delete product"
            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <FiTrash2 className="text-sm" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Products" description={`${meta.total} product${meta.total === 1 ? '' : 's'} in the catalogue.`}>
        <Button to="/admin/products/new" icon={FiPlus} size="sm">
          Add product
        </Button>
      </AdminPageHeader>

      <div className="card mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-300" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilter({ search: event.target.value })}
              placeholder="Search by name or SKU"
              aria-label="Search products"
              className="input pl-10 py-2.5 text-sm"
            />
          </div>

          <Select
            value={filters.category}
            onChange={(event) => setFilter({ category: event.target.value })}
            className="py-2.5 text-sm"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            value={filters.status}
            onChange={(event) => setFilter({ status: event.target.value })}
            className="py-2.5 text-sm"
            aria-label="Filter by status"
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Live' },
              { value: 'inactive', label: 'Hidden' },
            ]}
          />

          <Select
            value={filters.stock}
            onChange={(event) => setFilter({ stock: event.target.value })}
            className="py-2.5 text-sm"
            aria-label="Filter by stock"
            options={[
              { value: '', label: 'All stock levels' },
              { value: 'low', label: 'Low stock' },
              { value: 'out', label: 'Out of stock' },
            ]}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-cocoa-300">
            Showing {products.length} of {meta.total}
          </p>
          <Select
            value={filters.sort}
            onChange={(event) => setFilter({ sort: event.target.value })}
            options={SORTS}
            className="w-auto py-2 text-xs"
            aria-label="Sort products"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={products}
        isLoading={isLoading}
        onRowClick={(product) => navigate(`/admin/products/${product._id}/edit`)}
        emptyTitle="No products match those filters"
        emptyMessage="Try clearing a filter, or add your first product."
        emptyAction={{ label: 'Add product', to: '/admin/products/new' }}
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-8"
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        isLoading={isDeleting}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This permanently removes the product and its images. Orders that included it keep their own snapshot."
        confirmLabel="Delete product"
      />
    </div>
  );
};

export default Products;
