import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArchive, FiAlertTriangle, FiXCircle, FiDollarSign, FiSave, FiSearch } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import { adminInventoryService, adminProductService, adminCategoryService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice, formatNumber } from '../../utils/format.js';
import { stockStatus, productImage } from '../../utils/product.js';
import useDebounce from '../../hooks/useDebounce.js';

const STATUS_META = {
  in_stock: { tone: 'success', label: 'Healthy' },
  low_stock: { tone: 'warning', label: 'Low' },
  out_of_stock: { tone: 'danger', label: 'Out' },
};

const Inventory = () => {
  const { currency } = useSettings();

  const [snapshot, setSnapshot] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', page: 1 });

  /** Pending stock edits, keyed by product id, saved in one bulk request. */
  const [drafts, setDrafts] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => {
    adminCategoryService
      .list()
      .then((response) => setCategories(response.data.categories))
      .catch(() => setCategories([]));
  }, []);

  const loadSnapshot = () => {
    adminInventoryService
      .overview()
      .then((response) => setSnapshot(response.data.snapshot))
      .catch(() => setSnapshot(null));
  };

  const load = () => {
    setIsLoading(true);
    adminInventoryService
      .list({ ...filters, search: debouncedSearch, limit: 20 })
      .then((response) => {
        setProducts(response.data.products);
        setMeta(response.meta);
        setDrafts({});
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadSnapshot, []);
  useEffect(load, [debouncedSearch, filters.status, filters.category, filters.page]);

  const pendingCount = Object.keys(drafts).length;

  const saveAll = async () => {
    const updates = Object.entries(drafts).map(([id, stock]) => ({ id, stock: Number(stock) }));
    if (!updates.length) return;

    setIsSaving(true);
    try {
      const response = await adminProductService.bulkStock(updates);
      toast.success(response.message);
      load();
      loadSnapshot();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (product) => (
        <div className="flex items-center gap-3">
          <SmartImage src={productImage(product)} alt={product.name} width={100} className="h-11 w-11 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <Link
              to={`/admin/products/${product._id}/edit`}
              className="truncate font-semibold text-cocoa-800 hover:text-caramel-700"
            >
              {product.name}
            </Link>
            <p className="truncate text-xs text-cocoa-300">{product.sku || product.category?.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'threshold',
      header: 'Low at',
      hideOnMobile: true,
      align: 'center',
      render: (product) => <span className="text-cocoa-400">{product.lowStockThreshold}</span>,
    },
    {
      key: 'sold',
      header: 'Sold',
      hideOnMobile: true,
      align: 'center',
      render: (product) => <span className="text-cocoa-400">{product.soldCount || 0}</span>,
    },
    {
      key: 'value',
      header: 'Stock value',
      hideOnMobile: true,
      align: 'right',
      render: (product) => (
        <span className="text-cocoa-500">{formatPrice((product.stock || 0) * product.price, currency)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => {
        const meta = STATUS_META[stockStatus(product)];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: 'stock',
      header: 'In stock',
      align: 'right',
      render: (product) => {
        if (!product.trackInventory) return <span className="text-sm text-cocoa-300">Not tracked</span>;
        const value = drafts[product._id] ?? product.stock;
        const isDirty = drafts[product._id] !== undefined && Number(drafts[product._id]) !== product.stock;

        return (
          <input
            type="number"
            min="0"
            value={value}
            onChange={(event) => setDrafts((current) => ({ ...current, [product._id]: event.target.value }))}
            aria-label={`Stock for ${product.name}`}
            className={`input w-24 py-1.5 text-right text-sm ${isDirty ? 'border-caramel-400 bg-caramel-50' : ''}`}
          />
        );
      },
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Inventory" description="Edit stock inline, then save everything at once.">
        {pendingCount > 0 && (
          <>
            <span className="text-sm text-cocoa-400">
              {pendingCount} unsaved change{pendingCount === 1 ? '' : 's'}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setDrafts({})}>
              Discard
            </Button>
            <Button size="sm" icon={FiSave} onClick={saveAll} isLoading={isSaving}>
              Save changes
            </Button>
          </>
        )}
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          isLoading={!snapshot}
          icon={FiArchive}
          tone="caramel"
          label="Units in stock"
          value={formatNumber(snapshot?.totalUnits ?? 0)}
          hint={`Across ${snapshot?.totalProducts ?? 0} products`}
        />
        <StatCard
          isLoading={!snapshot}
          icon={FiAlertTriangle}
          tone="amber"
          label="Low stock"
          value={formatNumber(snapshot?.lowStock ?? 0)}
          hint="At or below the threshold"
        />
        <StatCard
          isLoading={!snapshot}
          icon={FiXCircle}
          tone="blush"
          label="Out of stock"
          value={formatNumber(snapshot?.outOfStock ?? 0)}
          hint="Cannot be ordered"
        />
        <StatCard
          isLoading={!snapshot}
          icon={FiDollarSign}
          tone="emerald"
          label="Stock value"
          value={formatPrice(snapshot?.stockValue ?? 0, currency)}
          hint="At list price"
        />
      </div>

      <div className="card my-5 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-300" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((c) => ({ ...c, search: event.target.value, page: 1 }))}
              placeholder="Search products"
              aria-label="Search inventory"
              className="input py-2.5 pl-10 text-sm"
            />
          </div>

          <Select
            value={filters.status}
            onChange={(event) => setFilters((c) => ({ ...c, status: event.target.value, page: 1 }))}
            className="py-2.5 text-sm"
            aria-label="Filter by stock level"
            options={[
              { value: '', label: 'All stock levels' },
              { value: 'healthy', label: 'Healthy' },
              { value: 'low', label: 'Low stock' },
              { value: 'out', label: 'Out of stock' },
            ]}
          />

          <Select
            value={filters.category}
            onChange={(event) => setFilters((c) => ({ ...c, category: event.target.value, page: 1 }))}
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
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={products}
        isLoading={isLoading}
        emptyTitle="No products match those filters"
        emptyMessage="Try a different stock level or category."
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-8"
      />
    </div>
  );
};

export default Inventory;
