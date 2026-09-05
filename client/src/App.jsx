import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import StoreLayout from './layouts/StoreLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import AccountLayout from './layouts/AccountLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import { ProtectedRoute, AdminRoute, GuestRoute } from './routes/ProtectedRoute.jsx';
import Spinner from './components/ui/Spinner.jsx';

/* Eagerly loaded: the pages a first-time visitor is most likely to hit. */
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetails from './pages/ProductDetails.jsx';

/* Everything else is code-split so the first paint stays fast. */
const Categories = lazy(() => import('./pages/Categories.jsx'));
const CategoryProducts = lazy(() => import('./pages/CategoryProducts.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const Payment = lazy(() => import('./pages/Payment.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const OrderFailed = lazy(() => import('./pages/OrderFailed.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));

const AccountProfile = lazy(() => import('./pages/account/Profile.jsx'));
const AccountOrders = lazy(() => import('./pages/account/Orders.jsx'));
const AccountOrderDetails = lazy(() => import('./pages/account/OrderDetails.jsx'));
const AccountAddresses = lazy(() => import('./pages/account/Addresses.jsx'));
const AccountReviews = lazy(() => import('./pages/account/Reviews.jsx'));
const AccountSettings = lazy(() => import('./pages/account/Settings.jsx'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'));
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/Categories.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'));
const AdminOrderDetails = lazy(() => import('./pages/admin/OrderDetails.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers.jsx'));
const AdminCustomerDetails = lazy(() => import('./pages/admin/CustomerDetails.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons.jsx'));
const AdminDeliveryZones = lazy(() => import('./pages/admin/DeliveryZones.jsx'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory.jsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'));
const AdminProfile = lazy(() => import('./pages/admin/Profile.jsx'));

const PageLoader = () => (
  <div className="flex min-h-[55vh] items-center justify-center text-cocoa-300">
    <Spinner size="lg" />
  </div>
);

const App = () => (
  <>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Storefront ───────────────────────────────────────────── */}
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductDetails />} />
          <Route path="categories" element={<Categories />} />
          <Route path="categories/:slug" element={<CategoryProducts />} />
          <Route path="cart" element={<Cart />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<Faq />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />

          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="payment/:orderId"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route path="order-success" element={<OrderSuccess />} />
          <Route path="order-failed" element={<OrderFailed />} />
          <Route
            path="wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          {/* ── Customer account ───────────────────────────────────── */}
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountProfile />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="orders/:id" element={<AccountOrderDetails />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="reviews" element={<AccountReviews />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ── Authentication ───────────────────────────────────────── */}
        <Route
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        >
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* ── Admin dashboard ──────────────────────────────────────── */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetails />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="customers/:id" element={<AdminCustomerDetails />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="delivery-zones" element={<AdminDeliveryZones />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </Suspense>

    <Toaster
      position="top-center"
      gutter={10}
      toastOptions={{
        duration: 3200,
        style: {
          background: '#33241A',
          color: '#FDF8F1',
          borderRadius: '9999px',
          padding: '10px 18px',
          fontSize: '0.875rem',
          fontWeight: 500,
          maxWidth: '90vw',
          boxShadow: '0 24px 48px -20px rgba(51, 36, 26, 0.45)',
        },
        success: { iconTheme: { primary: '#CE9450', secondary: '#33241A' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#33241A' } },
      }}
    />
  </>
);

export default App;
