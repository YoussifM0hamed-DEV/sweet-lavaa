import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true },
);

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    priceModifier: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required.'], trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    shortDescription: { type: String, trim: true, maxlength: 220, default: '' },
    description: { type: String, trim: true, maxlength: 5000, default: '' },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],

    price: { type: Number, required: [true, 'Price is required.'], min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0, select: false },

    stock: { type: Number, default: 0, min: 0, index: true },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    trackInventory: { type: Boolean, default: true },

    images: [imageSchema],
    variants: [variantSchema],

    ingredients: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    nutrition: {
      calories: { type: Number, default: null },
      servingSize: { type: String, default: '' },
    },
    weight: { type: String, default: '' },
    preparationTime: { type: String, default: '' },

    ratingAverage: { type: Number, default: 0, min: 0, max: 5, set: (v) => Math.round(v * 10) / 10 },
    ratingCount: { type: Number, default: 0, min: 0 },

    soldCount: { type: Number, default: 0, min: 0, index: true },
    viewCount: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isSeasonal: { type: Boolean, default: false },

    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

productSchema.index(
  { name: 'text', shortDescription: 'text', description: 'text', tags: 'text' },
  {
    weights: { name: 10, tags: 5, shortDescription: 3, description: 1 },
    name: 'product_search_index',
  },
);
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, soldCount: -1 });
productSchema.index({ price: 1 });

productSchema.virtual('finalPrice').get(function finalPrice() {
  if (this.discountPrice > 0 && this.discountPrice < this.price) return this.discountPrice;
  return this.price;
});

productSchema.virtual('discountPercentage').get(function discountPercentage() {
  if (!(this.discountPrice > 0 && this.discountPrice < this.price)) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

productSchema.virtual('inStock').get(function inStock() {
  if (!this.trackInventory) return true;
  return this.stock > 0;
});

productSchema.virtual('stockStatus').get(function stockStatus() {
  if (!this.trackInventory) return 'in_stock';
  if (this.stock <= 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

productSchema.virtual('primaryImage').get(function primaryImage() {
  if (!this.images?.length) return null;
  return (this.images.find((image) => image.isPrimary) || this.images[0]).url;
});

productSchema.pre('save', function normaliseImages(next) {
  if (this.images?.length && !this.images.some((image) => image.isPrimary)) {
    this.images[0].isPrimary = true;
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
export default Product;
