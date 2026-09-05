import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, max: 99, default: 1 },
    variant: {
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: '' },
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    // Only the code is stored. Validity and value are re-checked server side on every quote.
    couponCode: { type: String, uppercase: true, trim: true, default: null },
    deliveryZone: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone', default: null },
  },
  { timestamps: true },
);

cartSchema.methods.findItem = function findItem(productId, variantId = null) {
  return this.items.find(
    (item) =>
      String(item.product?._id || item.product) === String(productId) &&
      String(item.variant?.id || '') === String(variantId || ''),
  );
};

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
