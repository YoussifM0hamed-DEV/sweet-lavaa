# Sweet Lava

A production-ready e-commerce platform for a premium sweets and bakery brand — storefront, customer account area and a full admin dashboard.

**Stack:** React 18 + Vite + Tailwind on the front end · Node + Express + MongoDB/Mongoose on the back end · JWT and Google OAuth for auth · Cloudinary for media · Paymob for payments.

---

## Quick start

```bash
# 1. Install everything
npm install                 # root (concurrently)
npm run install:all         # server + client

# 2. Configure the server
cp server/.env.example server/.env
#    → set MONGODB_URI and JWT_SECRET at minimum

# 3. Configure the client (optional in development)
cp client/.env.example client/.env

# 4. Load realistic sample data
npm run seed

# 5. Run both apps
npm run dev
```

- Storefront → http://localhost:5173
- API → http://localhost:5000/api

### Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@sweetlava.com` | `Admin@12345` |
| Manager | `manager@sweetlava.com` | `Admin@12345` |
| Support | `support@sweetlava.com` | `Admin@12345` |
| Customer | `nour.hassan@example.com` | `Customer@123` |

The seed creates 9 categories, 30 products, 10 delivery zones, 6 coupons, 60 orders with a realistic status spread, and matching reviews — enough for every dashboard chart to have something to show.

`npm run seed` is destructive: it clears the database first. `npm run seed:destroy --prefix server` empties it without reseeding.

---

## Only these are required to boot

`MONGODB_URI` and `JWT_SECRET`. Everything else degrades gracefully:

- **No Cloudinary keys** → image uploads return a clear error; the rest of the admin works.
- **No Google client id** → the Google button simply is not rendered.
- **No Paymob keys** → card payment is disabled and cash on delivery carries the flow.

---

## Project layout

```
server/src
  config/       env parsing, database, cloudinary, roles & permissions
  models/       12 Mongoose models
  controllers/  request handling only
  services/     pricing, coupons, inventory, Paymob, Cloudinary, Google
  middleware/   auth, RBAC, validation, rate limiting, uploads, errors
  validators/   Zod schemas — every write is validated before a controller sees it
  routes/       REST routes grouped by resource
  seed/         sample catalogue and order history

client/src
  components/   ui/ layout/ product/ home/ admin/
  pages/        storefront, auth, account/, admin/
  layouts/      store, auth, account, admin shells
  context/      auth, cart, wishlist, settings
  services/     typed API clients per domain
  hooks/ utils/ styles/
```

---

## How the money is kept honest

This was the central design constraint, so it is worth stating plainly.

**The client never sends a price, discount, delivery fee or total.** The order request carries only contact details, an address, a delivery-zone id, a coupon code and a payment method. Everything financial is recomputed on the server in `services/pricing.service.js`, which is the single function used by the cart view, the checkout quote and order creation alike — so the customer is always charged exactly what they were shown.

Specifically:

- Unit prices come from the product document, never the request.
- Coupons are validated server-side for expiry, activity window, minimum spend, total usage limit, per-customer limit and product/category scope. The discount is capped at the cart value.
- Delivery fees come from the `DeliveryZone` document, including free-delivery thresholds and per-zone minimums.
- Stock is decremented with a conditional atomic update, so two customers cannot both buy the last item. A failed order rolls the reservation back.
- Payment results are never taken from the browser. Paymob's webhook is verified with an HMAC-SHA512 signature, and the redirect handler independently re-fetches the transaction server-to-server before anything is marked paid.
- Order line items snapshot the name, image and price at purchase time, so editing a product later cannot rewrite history.

---

## Roles and permissions

Roles map to granular permissions in `server/src/config/constants.js`, and routes are guarded by permission rather than by role name — so a new role is a data change, not a refactor.

| Role | Can do |
| --- | --- |
| `customer` | Browse, cart, checkout, own orders, wishlist, reviews |
| `support` | View products, orders and customers |
| `manager` | Everything support can, plus manage products, categories, orders, coupons, inventory and reviews |
| `admin` / `super_admin` | All of the above, plus users, roles, delivery zones and site settings |

Two rules worth calling out: nobody can modify an account at or above their own role, and a role change bumps the account's token version so the new permissions apply immediately rather than at next login.

---

## API

Base URL `/api`.

| Group | Notable endpoints |
| --- | --- |
| `/auth` | `register`, `login`, `google`, `logout`, `me`, `password`, `forgot-password`, `reset-password/:token` |
| `/users` | `profile`, `avatar`, `stats`, `addresses` (CRUD + default) |
| `/products` | list with filters, `:slug`, `collection/:name`, `search/suggestions`, `price-range`, admin CRUD, image upload |
| `/categories` | public list, `:slug`, admin CRUD, `reorder`, image upload |
| `/cart` | `items`, `coupon`, `merge` (guest cart), `quote` |
| `/wishlist` | list, `ids`, add, remove, clear |
| `/orders` | create, `my`, `:id`, `cancel`, `track/:orderNumber`, admin list and status management |
| `/payments` | `paymob/initiate/:orderId`, `paymob/webhook`, `paymob/callback`, `status/:orderId` |
| `/coupons` | `check`, admin CRUD |
| `/delivery-zones` | public list, admin CRUD |
| `/reviews` | `product/:productId`, create/update/delete own, admin moderation |
| `/settings` | public config, admin read/update, branding upload |
| `/admin` | dashboard stats, analytics, customers, staff, inventory, inbox |

Responses are consistently shaped: `{ success, data, meta?, message? }` on success and `{ success: false, message, errors? }` on failure. Stack traces are development-only.

---

## Security

Password hashing with bcrypt (cost 12) · JWTs with a token-version field so sessions can be revoked · role and permission middleware on every admin route · Zod validation that replaces the request body with the parsed result · `express-mongo-sanitize` and `hpp` · Helmet · an allow-list CORS policy · rate limiting that is tighter on auth and payment endpoints · HMAC verification of payment callbacks · generic messages on login and password-reset so neither can be used to enumerate accounts.

---

## Front-end notes

- **Design system** lives in `tailwind.config.js` and `styles/index.css`: a cream/chocolate/caramel palette, Fraunces for display and Plus Jakarta Sans for text, plus reusable `.btn-*`, `.card`, `.input` and `.badge-*` classes.
- **Motion** is deliberate and subtle: hover lifts, image zoom on cards, reveal-on-scroll via an IntersectionObserver hook, and a cart-count bump. All of it collapses under `prefers-reduced-motion`.
- **Images** go through `SmartImage`, which shows a branded gradient placeholder while loading and keeps it if the request fails, so a dead URL never leaves a grey box.
- **Loading and empty states** are designed rather than blank: skeletons that match the final layout, and empty states with a way forward.
- **Mobile** layouts are built rather than shrunk — a dedicated slide-in navigation, a bottom-sheet filter panel, and tables that become cards below `lg`.
- **Code splitting** keeps the initial bundle small; only Home, Products and Product details load eagerly.

---

## Notes for production

- Set `NODE_ENV=production`, a strong `JWT_SECRET`, and `CLIENT_URL` to the deployed origin (CORS reads it).
- Point Paymob's webhook at `POST /api/payments/paymob/webhook` and its redirect at `GET /api/payments/paymob/callback`.
- `npm run build` outputs the client to `client/dist`; serve it from any static host.
- The API runs behind a proxy (`trust proxy` is on) so rate limiting sees real client IPs.
