import mongoose from 'mongoose';
import { COUPON_TYPES } from '../config/constants.js';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required.'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 240, default: '' },
    discountType: { type: String, enum: Object.values(COUPON_TYPES), required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    // Caps the discount for percentage coupons. 0 means uncapped.
    maxDiscountAmount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
        lastUsedAt: Date,
      },
    ],
    // Optional scoping. Empty arrays mean the coupon applies to everything.
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

couponSchema.virtual('isExpired').get(function isExpired() {
  return this.expiresAt < new Date();
});

couponSchema.virtual('isExhausted').get(function isExhausted() {
  return this.usageLimit > 0 && this.usedCount >= this.usageLimit;
});

couponSchema.methods.usageForUser = function usageForUser(userId) {
  const entry = this.usedBy.find((item) => String(item.user) === String(userId));
  return entry?.count || 0;
};

export const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
