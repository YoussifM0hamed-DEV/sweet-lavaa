import { DeliveryZone, Order } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** Public: only zones we currently deliver to. */
export const listDeliveryZones = asyncHandler(async (_req, res) => {
  const zones = await DeliveryZone.find({ isActive: true })
    .select('name governorate deliveryFee freeDeliveryThreshold estimatedTime minimumOrderAmount')
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return sendSuccess(res, { data: { zones } });
});

export const adminListDeliveryZones = asyncHandler(async (_req, res) => {
  const zones = await DeliveryZone.find().sort({ displayOrder: 1, name: 1 }).lean();
  return sendSuccess(res, { data: { zones } });
});

export const createDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.create(req.body);
  return sendSuccess(res, { status: 201, message: `${zone.name} added.`, data: { zone } });
});

export const updateDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!zone) throw ApiError.notFound('Delivery area not found.');
  return sendSuccess(res, { message: 'Delivery area updated.', data: { zone } });
});

export const deleteDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findById(req.params.id);
  if (!zone) throw ApiError.notFound('Delivery area not found.');

  // Historic orders reference the zone, so removal is blocked once it is used.
  const ordersCount = await Order.countDocuments({ 'deliveryZone.zone': zone._id });
  if (ordersCount > 0) {
    throw ApiError.conflict(
      `${zone.name} is used by ${ordersCount} order(s). Disable it instead of deleting it.`,
    );
  }

  await zone.deleteOne();
  return sendSuccess(res, { message: 'Delivery area deleted.' });
});

export const toggleDeliveryZoneStatus = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findById(req.params.id);
  if (!zone) throw ApiError.notFound('Delivery area not found.');

  zone.isActive = !zone.isActive;
  await zone.save();

  return sendSuccess(res, {
    message: zone.isActive ? `${zone.name} is now available.` : `${zone.name} is now disabled.`,
    data: { zone },
  });
});
