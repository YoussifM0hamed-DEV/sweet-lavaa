import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required.'], trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    tagline: { type: String, trim: true, maxlength: 120, default: '' },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    /** Manual ordering controlled from the admin dashboard. */
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

categorySchema.index({ displayOrder: 1, name: 1 });

categorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

export const Category = mongoose.model('Category', categorySchema);
export default Category;
