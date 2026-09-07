import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';

/**
 * Order line items snapshot the product name, image and price at purchase time,
 * so historical orders stay accurate even after a product is edited or removed.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, default: '' },
    image: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categoryName: { type: String, default: '' },
    variant: {
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: '' },
    },
    unitPrice: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    items: { type: [orderItemSchema], validate: [(value) => value.length > 0, 'An order must contain at least one item.'] },

    contact: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },

    shippingAddress: {
      governorate: { type: String, default: '' },
      city: { type: String, default: '' },
      district: { type: String, default: '' },
      street: { type: String, required: true },
      building: { type: String, default: '' },
      apartment: { type: String, default: '' },
      floor: { type: String, default: '' },
      notes: { type: String, default: '' },
    },

    deliveryZone: {
      zone: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone', required: true },
      name: { type: String, required: true },
      fee: { type: Number, required: true, min: 0 },
      estimatedTime: { type: String, default: '' },
    },

    coupon: {
      coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
      code: { type: String, default: null },
      discountType: { type: String, default: null },
      discountValue: { type: Number, default: 0 },
    },

    // Every figure below is computed server side from the product catalogue.
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'EGP' },
    },

    payment: {
      method: { type: String, enum: Object.values(PAYMENT_METHODS), default: PAYMENT_METHODS.COD },
      status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
      provider: { type: String, default: 'cash' },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null },
      failureReason: { type: String, default: '' },
      refundedAt: { type: Date, default: null },
      raw: { type: mongoose.Schema.Types.Mixed, select: false },
    },

    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
      },
    ],

    // Set once stock has been decremented so it can never be applied twice.
    inventoryApplied: { type: Boolean, default: false },
    customerNotes: { type: String, default: '', maxlength: 500 },
    adminNotes: { type: String, default: '', maxlength: 1000 },
    cancelledAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

orderSchema.virtual('itemsCount').get(function itemsCount() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.methods.pushStatus = function pushStatus(status, changedBy = null, note = '') {
  this.statusHistory.push({ status, changedBy, note, changedAt: new Date() });
};

export const Order = mongoose.model('Order', orderSchema);
export default Order;
