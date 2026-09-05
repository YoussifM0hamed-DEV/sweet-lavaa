import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    comment: { type: String, trim: true, maxlength: 1500, required: true },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    helpfulCount: { type: Number, default: 0 },
    adminReply: {
      message: { type: String, default: '' },
      repliedAt: Date,
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true },
);

// A customer may review a given product only once.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

/**
 * Recomputes the product rating aggregate. Called after every write so the
 * denormalised values on Product never drift.
 */
reviewSchema.statics.syncProductRating = async function syncProductRating(productId) {
  const [result] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'approved' } },
    { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await mongoose.model('Product').findByIdAndUpdate(productId, {
    ratingAverage: result?.average || 0,
    ratingCount: result?.count || 0,
  });
};

reviewSchema.post('save', function afterSave(doc) {
  doc.constructor.syncProductRating(doc.product);
});

reviewSchema.post('findOneAndUpdate', function afterUpdate(doc) {
  if (doc) doc.constructor.syncProductRating(doc.product);
});

reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) doc.constructor.syncProductRating(doc.product);
});

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
