import { Router } from 'express';
import * as zone from '../controllers/deliveryZone.controller.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PERMISSIONS } from '../config/constants.js';
import { idParams } from '../validators/common.js';
import * as schema from '../validators/deliveryZone.validator.js';

const router = Router();
const manage = [protect, requirePermission(PERMISSIONS.DELIVERY_MANAGE)];

router.get('/', zone.listDeliveryZones);
router.get('/admin/list', manage, zone.adminListDeliveryZones);

router.post('/', manage, validate({ body: schema.deliveryZoneBodySchema }), zone.createDeliveryZone);
router.patch('/:id', manage, validate({ params: idParams, body: schema.updateDeliveryZoneSchema }), zone.updateDeliveryZone);
router.delete('/:id', manage, validate({ params: idParams }), zone.deleteDeliveryZone);
router.patch('/:id/status', manage, validate({ params: idParams }), zone.toggleDeliveryZoneStatus);

export default router;
