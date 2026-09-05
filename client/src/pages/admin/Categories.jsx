import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiArrowUp, FiArrowDown, FiImage, FiUploadCloud,
} from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Input, { Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminCategoryService } from '../../services/adminService.js';

const EMPTY = { name: '', tagline: '', description: '', displayOrder: 0, isActive: true, isFeatured: false };

const Categories = () => {
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  const load = () => {
    adminCategoryService
      .list()
      .then((response) => setCategories(response.data.categories))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const save = async (event) => {
    event.preventDefault();

    if (form.name.trim().length < 2) {
      setErrors({ name: 'Category name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) || 0 };
      if (editing === 'new') await adminCategoryService.create(payload);
      else await adminCategoryService.update(editing, payload);

      toast.success(editing === 'new' ? 'Category created.' : 'Category updated.');
      setEditing(null);
      load();
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (category) => {
    try {
      const response = await adminCategoryService.toggleStatus(category._id);
      toast.success(response.message);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async () => {
    try {
      await adminCategoryService.remove(deleteTarget._id);
      toast.success('Category deleted.');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  /** Swaps display order with the neighbour and persists the whole list. */
  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;

    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);

    try {
      await adminCategoryService.reorder(next.map((category, position) => ({ id: category._id, displayOrder: position })));
      toast.success('Order saved.');
    } catch (error) {
      toast.error(error.message);
      load();
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingFor) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please choose an image under 5 MB.');
      event.target.value = '';
      return;
    }

    try {
      await adminCategoryService.uploadImage(uploadingFor, file);
      toast.success('Category image updated.');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingFor(null);
      event.target.value = '';
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Drag order, visibility and imagery for the storefront navigation."
      >
        <Button
          size="sm"
          icon={FiPlus}
          onClick={() => {
            setForm({ ...EMPTY, displayOrder: categories.length });
            setErrors({});
            setEditing('new');
          }}
        >
          Add category
        </Button>
      </AdminPageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-card" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiImage}
            title="No categories yet"
            message="Create your first category so products have somewhere to live."
            actionLabel="Add category"
            onAction={() => {
              setForm(EMPTY);
              setEditing('new');
            }}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <article key={category._id} className="card overflow-hidden">
              <div className="relative aspect-[16/9]">
                <SmartImage
                  src={category.image?.url}
                  alt={category.name}
                  width={600}
                  className="h-full w-full"
                />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <Badge tone={category.isActive ? 'success' : 'neutral'}>
                    {category.isActive ? 'Visible' : 'Hidden'}
                  </Badge>
                  {category.isFeatured && <Badge tone="new">Featured</Badge>}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUploadingFor(category._id);
                    fileRef.current?.click();
                  }}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-cream-50/90 px-3 py-1.5 text-xs font-semibold text-cocoa-700 backdrop-blur transition-colors hover:bg-cream-50"
                >
                  {uploadingFor === category._id ? <Spinner size="xs" /> : <FiUploadCloud />}
                  Image
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg text-cocoa-800">{category.name}</h2>
                    {category.tagline && <p className="truncate text-xs text-cocoa-300">{category.tagline}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-cream-200 px-2.5 py-1 text-xs font-semibold text-cocoa-500">
                    {category.productsCount ?? 0}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700 disabled:opacity-30"
                    >
                      <FiArrowUp className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === categories.length - 1}
                      aria-label="Move down"
                      className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700 disabled:opacity-30"
                    >
                      <FiArrowDown className="text-sm" />
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleStatus(category)}
                      aria-label={category.isActive ? 'Hide category' : 'Show category'}
                      className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
                    >
                      {category.isActive ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...EMPTY, ...category });
                        setErrors({});
                        setEditing(category._id);
                      }}
                      aria-label="Edit category"
                      className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      aria-label="Delete category"
                      className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a category' : 'Edit category'}
      >
        <form onSubmit={save} className="space-y-5" noValidate>
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
            error={errors.name}
            placeholder="Cheesecakes"
            required
          />

          <Input
            label="Tagline"
            value={form.tagline}
            onChange={(event) => setForm((c) => ({ ...c, tagline: event.target.value }))}
            placeholder="Slow baked, impossibly creamy"
            maxLength={120}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
            placeholder="Shown on the category page."
            rows={3}
          />

          <Input
            label="Display order"
            type="number"
            value={form.displayOrder}
            onChange={(event) => setForm((c) => ({ ...c, displayOrder: event.target.value }))}
            hint="Lower numbers appear first."
          />

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((c) => ({ ...c, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
              />
              Visible in the store
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-600">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm((c) => ({ ...c, isFeatured: event.target.checked }))}
                className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
              />
              Feature on the home page
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Saving...">
              Save category
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete "${deleteTarget?.name}"?`}
        message="Categories that still contain products cannot be deleted. Hide it instead if you want to keep the products."
        confirmLabel="Delete category"
      />
    </div>
  );
};

export default Categories;
