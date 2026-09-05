import { Router } from 'express';
import * as dashboard from '../controllers/dashboard.controller.js';
import * as adminUser from '../controllers/adminUser.controller.js';
import * as inventory from '../controllers/inventory.controller.js';
import * as misc from '../controllers/misc.controller.js';
import { protect, requireStaff, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PERMISSIONS } from '../config/constants.js';
import { idParams } from '../validators/common.js';
import * as schema from '../validators/user.validator.js';

const router = Router();

/* Every route below is staff-only: a customer token can never reach them. */
router.use(protect, requireStaff);

/* ── Dashboard & analytics ────────────────────────────────────────────── */
const analytics = requirePermission(PERMISSIONS.ANALYTICS_VIEW);

router.get('/stats/overview', analytics, dashboard.getOverview);
router.get('/stats/sales', analytics, dashboard.getSalesSeries);
router.get('/stats/top-products', analytics, dashboard.getTopProducts);
router.get('/stats/revenue-by-category', analytics, dashboard.getRevenueByCategory);
router.get('/stats/zones', analytics, dashboard.getZonePerformance);
router.get('/stats/customers', analytics, dashboard.getCustomerInsights);
router.get('/stats/recent-orders', requirePermission(PERMISSIONS.ORDER_VIEW), dashboard.getRecentOrders);

/* ── Customers ────────────────────────────────────────────────────────── */
router.get('/customers', requirePermission(PERMISSIONS.CUSTOMER_VIEW), adminUser.listCustomers);
router.get('/customers/:id', requirePermission(PERMISSIONS.CUSTOMER_VIEW), validate({ params: idParams }), adminUser.getCustomer);
router.patch(
  '/customers/:id/status',
  requirePermission(PERMISSIONS.CUSTOMER_MANAGE),
  validate({ params: idParams }),
  adminUser.toggleUserStatus,
);

/* ── Staff & roles ────────────────────────────────────────────────────── */
const userManage = requirePermission(PERMISSIONS.USER_MANAGE);

router.get('/staff', userManage, adminUser.listStaff);
router.get('/roles', userManage, adminUser.getAvailableRoles);
router.post('/staff', userManage, validate({ body: schema.createStaffSchema }), adminUser.createStaff);
router.patch('/staff/:id/role', userManage, validate({ params: idParams, body: schema.updateUserRoleSchema }), adminUser.updateUserRole);
router.delete('/staff/:id', userManage, validate({ params: idParams }), adminUser.deleteStaff);

/* ── Inventory ────────────────────────────────────────────────────────── */
const stock = requirePermission(PERMISSIONS.INVENTORY_MANAGE);

router.get('/inventory', stock, inventory.listInventory);
router.get('/inventory/overview', stock, inventory.getInventoryOverview);
router.get('/inventory/alerts', stock, inventory.getLowStockAlerts);

/* ── Inbox & subscribers ──────────────────────────────────────────────── */
router.get('/messages', requirePermission(PERMISSIONS.CUSTOMER_VIEW), misc.adminListMessages);
router.patch('/messages/:id', requirePermission(PERMISSIONS.CUSTOMER_MANAGE), validate({ params: idParams }), misc.updateMessageStatus);
router.get('/subscribers', requirePermission(PERMISSIONS.CUSTOMER_VIEW), misc.adminListSubscribers);

export default router;
