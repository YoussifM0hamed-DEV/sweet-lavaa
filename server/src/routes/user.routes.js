import { Router } from 'express';
import * as user from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { idParams } from '../validators/common.js';
import * as schema from '../validators/user.validator.js';

const router = Router();

router.use(protect);

router.patch('/profile', validate({ body: schema.updateProfileSchema }), user.updateProfile);
router.patch('/avatar', uploadSingleImage, user.updateAvatar);
router.get('/stats', user.getMyStats);
router.delete('/me', user.deleteMyAccount);

router
  .route('/addresses')
  .get(user.listAddresses)
  .post(validate({ body: schema.addressSchema }), user.addAddress);

router
  .route('/addresses/:id')
  .patch(validate({ params: idParams, body: schema.addressSchema.partial() }), user.updateAddress)
  .delete(validate({ params: idParams }), user.deleteAddress);

router.patch('/addresses/:id/default', validate({ params: idParams }), user.setDefaultAddress);

export default router;
