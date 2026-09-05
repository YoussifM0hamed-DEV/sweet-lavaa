import mongoose from 'mongoose';

const deliveryZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Zone name is required.'], trim: true, unique: true, maxlength: 80 },
    governorate: { type: String, trim: true, default: 'Cairo' },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    // Orders at or above this subtotal ship free. 0 disables the rule.
    freeDeliveryThreshold: { type: Number, default: 0, min: 0 },
    estimatedTime: { type: String, default: '1-2 Days', trim: true },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true },
);

deliveryZoneSchema.index({ displayOrder: 1, name: 1 });

export const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);
export default DeliveryZone;
