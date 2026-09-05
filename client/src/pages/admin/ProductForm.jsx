import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiUploadCloud, FiTrash2, FiStar, FiPlus, FiX, FiSave,
} from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Input, { Textarea, Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminProductService, adminCategoryService } from '../../services/adminService.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ALLERGEN_OPTIONS } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const EMPTY = {
  name: '', shortDescription: '', description: '', category: '',
  price: '', discountPrice: '', costPrice: '',
  stock: '', lowStockThreshold: 5, trackInventory: true,
  tags: [], ingredients: [], allergens: [], variants: [],
  weight: '', preparationTime: '', sku: '',
  isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: false, isSeasonal: false,
};

const Section = ({ title, description, children }) => (
  <section className="card p-6">
    <h2 className="font-display text-lg text-cocoa-800">{title}</h2>
    {description && <p className="mt-1 text-sm text-cocoa-400">{description}</p>}
    <div className="mt-5 space-y-5">{children}</div>
  </section>
);

/** Comma/enter-driven tag editor used for tags, ingredients and allergens. */
const TokenInput = ({ label, values, onChange, placeholder, suggestions }) => {
  const [draft, setDraft] = useState('');

  const add = (value) => {
    const clean = value.trim();
    if (!clean || values.includes(clean)) return;
    onChange([...values, clean]);
    setDraft('');
  };

  return (
    <div>
      <p className="label">{label}</p>

      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-cream-300 py-1 pl-3 pr-1.5 text-xs font-medium text-cocoa-700">
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((entry) => entry !== value))}
                aria-label={`Remove ${value}`}
                className="rounded-full p-0.5 text-cocoa-400 transition-colors hover:bg-cocoa-200 hover:text-cocoa-800"
              >
                <FiX className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => add(draft)}
        placeholder={placeholder}
        className="input"
      />

      {suggestions && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((entry) => !values.includes(entry))
            .map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => add(entry)}
                className="rounded-full border border-cream-400 px-2.5 py-1 text-xs text-cocoa-400 transition-colors hover:border-cocoa-400 hover:text-cocoa-700"
              >
                + {entry}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useSettings();
  const fileRef = useRef(null);

  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [deleteImageTarget, setDeleteImageTarget] = useState(null);

  useEffect(() => {
    adminCategoryService
      .list()
      .then((response) => setCategories(response.data.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    adminProductService
      .getOne(id)
      .then((response) => {
        const product = response.data.product;
        setForm({
          ...EMPTY,
          ...product,
          category: product.category?._id || product.category || '',
          discountPrice: product.discountPrice || '',
          costPrice: product.costPrice || '',
          variants: product.variants || [],
        });
        setImages(product.images || []);
      })
      .catch((error) => {
        toast.error(error.message);
        navigate('/admin/products', { replace: true });
      })
      .finally(() => setIsLoading(false));
  }, [id, isEdit, navigate]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Product name is required.';
    if (!form.category) found.category = 'Please choose a category.';
    if (form.price === '' || Number(form.price) < 0) found.price = 'Enter a valid price.';
    if (form.discountPrice !== '' && Number(form.discountPrice) > 0 && Number(form.discountPrice) >= Number(form.price)) {
      found.discountPrice = 'The discount price must be lower than the regular price.';
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    shortDescription: form.shortDescription,
    description: form.description,
    category: form.category,
    price: Number(form.price),
    discountPrice: form.discountPrice === '' ? 0 : Number(form.discountPrice),
    costPrice: form.costPrice === '' ? 0 : Number(form.costPrice),
    stock: form.stock === '' ? 0 : Number(form.stock),
    lowStockThreshold: Number(form.lowStockThreshold) || 0,
    trackInventory: form.trackInventory,
    tags: form.tags,
    ingredients: form.ingredients,
    allergens: form.allergens,
    variants: form.variants.map((variant) => ({
      ...(variant._id ? { _id: variant._id } : {}),
      name: variant.name,
      priceModifier: Number(variant.priceModifier) || 0,
      stock: Number(variant.stock) || 0,
      isAvailable: variant.isAvailable !== false,
    })),
    weight: form.weight,
    preparationTime: form.preparationTime,
    ...(form.sku ? { sku: form.sku } : {}),
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    isBestSeller: form.isBestSeller,
    isNewArrival: form.isNewArrival,
    isSeasonal: form.isSeasonal,
  });

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await adminProductService.update(id, buildPayload());
        toast.success('Product updated.');
      } else {
        const response = await adminProductService.create(buildPayload());
        toast.success('Product created. You can add images now.');
        navigate(`/admin/products/${response.data.product._id}/edit`, { replace: true });
      }
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error(`"${oversized.name}" is larger than 5 MB.`);
      event.target.value = '';
      return;
    }

    setUploadProgress(0);
    try {
      const response = await adminProductService.uploadImages(id, files, setUploadProgress);
      setImages(response.data.images);
      toast.success('Images uploaded.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadProgress(null);
      event.target.value = '';
    }
  };

  const removeImage = async () => {
    try {
      const response = await adminProductService.deleteImage(id, deleteImageTarget);
      setImages(response.data.images);
      toast.success('Image removed.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteImageTarget(null);
    }
  };

  const makePrimary = async (imageId) => {
    try {
      const response = await adminProductService.setPrimaryImage(id, imageId);
      setImages(response.data.images);
      toast.success('Main image updated.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-400 hover:text-cocoa-800">
        <FiArrowLeft /> All products
      </Link>

      <AdminPageHeader
        title={isEdit ? 'Edit product' : 'Add a product'}
        description={isEdit ? form.name : 'Fill in the details, then add photos once it is saved.'}
      >
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
          Cancel
        </Button>
        <Button type="submit" size="sm" icon={FiSave} isLoading={isSaving} loadingText="Saving...">
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
      </AdminPageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Section title="Basics" description="What the customer sees first.">
            <Input
              label="Product name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              error={errors.name}
              placeholder="Molten Chocolate Lava Cake"
              required
            />

            <Input
              label="Short description"
              value={form.shortDescription}
              onChange={(event) => setField('shortDescription', event.target.value)}
              error={errors.shortDescription}
              placeholder="One line that makes someone want it."
              maxLength={220}
              hint={`${form.shortDescription.length}/220 characters — shown on product cards.`}
            />

            <Textarea
              label="Full description"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              error={errors.description}
              placeholder="Describe the texture, the ingredients and how it is best served."
              rows={6}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Category"
                value={form.category}
                onChange={(event) => setField('category', event.target.value)}
                error={errors.category}
                required
              >
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                    {!category.isActive ? ' (hidden)' : ''}
                  </option>
                ))}
              </Select>

              <Input
                label="SKU"
                value={form.sku}
                onChange={(event) => setField('sku', event.target.value)}
                error={errors.sku}
                placeholder="Generated automatically if left blank"
              />
            </div>

            <TokenInput
              label="Tags"
              values={form.tags}
              onChange={(tags) => setField('tags', tags)}
              placeholder="Type a tag and press Enter"
            />
          </Section>

          <Section title="Pricing" description="The discount price is what the customer pays when it is set.">
            <div className="grid gap-5 sm:grid-cols-3">
              <Input
                label={`Price (${currency})`}
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(event) => setField('price', event.target.value)}
                error={errors.price}
                required
              />
              <Input
                label={`Discount price (${currency})`}
                type="number"
                min="0"
                step="1"
                value={form.discountPrice}
                onChange={(event) => setField('discountPrice', event.target.value)}
                error={errors.discountPrice}
                hint="Leave blank for no discount"
              />
              <Input
                label={`Cost price (${currency})`}
                type="number"
                min="0"
                step="1"
                value={form.costPrice}
                onChange={(event) => setField('costPrice', event.target.value)}
                hint="Internal only"
              />
            </div>
          </Section>

          <Section title="Inventory">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-600">
              <input
                type="checkbox"
                checked={form.trackInventory}
                onChange={(event) => setField('trackInventory', event.target.checked)}
                className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
              />
              Track stock for this product
            </label>

            {form.trackInventory && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Stock quantity"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => setField('stock', event.target.value)}
                  error={errors.stock}
                />
                <Input
                  label="Low stock threshold"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(event) => setField('lowStockThreshold', event.target.value)}
                  hint="We warn you at or below this number."
                />
              </div>
            )}
          </Section>

          <Section title="Options" description="Sizes or variations. The modifier is added to the base price.">
            {form.variants.length > 0 && (
              <div className="space-y-3">
                {form.variants.map((variant, index) => (
                  <div key={variant._id || index} className="grid gap-3 rounded-xl bg-cream-200/60 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                    <input
                      value={variant.name}
                      onChange={(event) => {
                        const next = [...form.variants];
                        next[index] = { ...variant, name: event.target.value };
                        setField('variants', next);
                      }}
                      placeholder="Option name"
                      aria-label="Option name"
                      className="input py-2 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.priceModifier ?? 0}
                      onChange={(event) => {
                        const next = [...form.variants];
                        next[index] = { ...variant, priceModifier: event.target.value };
                        setField('variants', next);
                      }}
                      placeholder="+ price"
                      aria-label="Price modifier"
                      className="input py-2 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.stock ?? 0}
                      onChange={(event) => {
                        const next = [...form.variants];
                        next[index] = { ...variant, stock: event.target.value };
                        setField('variants', next);
                      }}
                      placeholder="Stock"
                      aria-label="Option stock"
                      className="input py-2 text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-cocoa-500">
                        <input
                          type="checkbox"
                          checked={variant.isAvailable !== false}
                          onChange={(event) => {
                            const next = [...form.variants];
                            next[index] = { ...variant, isAvailable: event.target.checked };
                            setField('variants', next);
                          }}
                          className="h-3.5 w-3.5 rounded border-cocoa-300 accent-caramel-500"
                        />
                        On
                      </label>
                      <button
                        type="button"
                        onClick={() => setField('variants', form.variants.filter((_, i) => i !== index))}
                        aria-label="Remove option"
                        className="rounded-full p-1.5 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={FiPlus}
              onClick={() =>
                setField('variants', [...form.variants, { name: '', priceModifier: 0, stock: 0, isAvailable: true }])
              }
            >
              Add option
            </Button>
          </Section>

          <Section title="Ingredients & allergens" description="Shown on the product page. Be accurate here.">
            <TokenInput
              label="Ingredients"
              values={form.ingredients}
              onChange={(value) => setField('ingredients', value)}
              placeholder="Type an ingredient and press Enter"
            />
            <TokenInput
              label="Allergens"
              values={form.allergens}
              onChange={(value) => setField('allergens', value)}
              placeholder="Type an allergen and press Enter"
              suggestions={ALLERGEN_OPTIONS}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Weight"
                value={form.weight}
                onChange={(event) => setField('weight', event.target.value)}
                placeholder="1.2 kg"
              />
              <Input
                label="Preparation time"
                value={form.preparationTime}
                onChange={(event) => setField('preparationTime', event.target.value)}
                placeholder="Baked to order, 3 hours"
              />
            </div>
          </Section>
        </div>

        {/* Sidebar: images and visibility */}
        <aside className="space-y-6">
          <Section title="Images" description={isEdit ? 'Up to 8. The first one is the main image.' : 'Save the product first to add photos.'}>
            {isEdit ? (
              <>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5">
                    {images.map((image) => (
                      <div key={image._id} className="group relative aspect-square overflow-hidden rounded-xl">
                        <SmartImage src={image.url} alt={image.alt || form.name} width={300} className="h-full w-full" />

                        {image.isPrimary && (
                          <Badge tone="best" className="absolute left-1.5 top-1.5 !px-1.5 !py-0.5 !text-[0.6rem]">
                            Main
                          </Badge>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-cocoa-900/60 opacity-0 transition-opacity group-hover:opacity-100">
                          {!image.isPrimary && (
                            <button
                              type="button"
                              onClick={() => makePrimary(image._id)}
                              aria-label="Make main image"
                              className="rounded-full bg-cream-50 p-2 text-cocoa-700 transition-colors hover:bg-caramel-500 hover:text-white"
                            >
                              <FiStar className="text-xs" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteImageTarget(image._id)}
                            aria-label="Delete image"
                            className="rounded-full bg-cream-50 p-2 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {uploadProgress !== null ? (
                  <div className="rounded-xl border border-cream-400 p-4">
                    <p className="flex items-center gap-2 text-sm text-cocoa-500">
                      <Spinner size="sm" /> Uploading… {uploadProgress}%
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-300">
                      <div className="h-full rounded-full bg-caramel-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  images.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-cream-400 py-8 text-cocoa-400 transition-colors hover:border-caramel-400 hover:text-caramel-600"
                    >
                      <FiUploadCloud className="text-2xl" />
                      <span className="text-sm font-medium">Upload images</span>
                      <span className="text-xs text-cocoa-300">JPG, PNG or WEBP, up to 5 MB each</span>
                    </button>
                  )
                )}

                <input ref={fileRef} type="file" accept="image/*" multiple onChange={uploadImages} className="hidden" />
              </>
            ) : (
              <p className="rounded-xl bg-cream-200 px-4 py-3.5 text-sm text-cocoa-400">
                Create the product first, then come back to upload photos.
              </p>
            )}
          </Section>

          <Section title="Visibility">
            {[
              { field: 'isActive', label: 'Live in the store', hint: 'Customers can see and buy it.' },
              { field: 'isFeatured', label: 'Featured', hint: 'Appears in featured collections.' },
              { field: 'isBestSeller', label: 'Best seller', hint: 'Shows the best seller badge.' },
              { field: 'isNewArrival', label: 'New arrival', hint: 'Appears in new arrivals.' },
              { field: 'isSeasonal', label: 'Seasonal', hint: 'Part of a limited collection.' },
            ].map((toggle) => (
              <label key={toggle.field} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form[toggle.field]}
                  onChange={(event) => setField(toggle.field, event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
                />
                <span>
                  <span className="block text-sm font-medium text-cocoa-700">{toggle.label}</span>
                  <span className="block text-xs text-cocoa-300">{toggle.hint}</span>
                </span>
              </label>
            ))}
          </Section>

          <Button type="submit" fullWidth icon={FiSave} isLoading={isSaving} loadingText="Saving...">
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteImageTarget)}
        onClose={() => setDeleteImageTarget(null)}
        onConfirm={removeImage}
        title="Delete this image?"
        message="It will be removed from the product and from Cloudinary."
        confirmLabel="Delete image"
      />
    </form>
  );
};

export default ProductForm;
