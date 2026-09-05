# Deploying Sweet Lava

**One Render service serves both the API and the storefront.** Express serves the built React app,
so there is a single URL, no CORS to configure, and nothing to keep in sync between two hosts.

Database stays on **MongoDB Atlas**, media on **Cloudinary**.

---

## 0. Push to GitHub

```bash
git add -A
git commit -m "your message"
git push
```

`.gitignore` excludes `.env` and `render-env.txt`, so no secrets are committed.

---

## 1. Create the Render service

[dashboard.render.com](https://dashboard.render.com) -> **New** -> **Web Service** -> connect the repo.

| Field | Value |
| --- | --- |
| Name | `sweet-lavaa` |
| Language | Node |
| Branch | `main` |
| Region | Frankfurt (EU Central) |
| **Root Directory** | **leave empty** (repo root) |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| Health Check Path | `/api/health` |
| Instance Type | Free |

`npm run build` installs both halves and builds the client into `client/dist`.
`npm start` boots Express, which detects that build and serves it.

> Root Directory must be **empty**, not `server`. The build needs the whole repo.

---

## 2. Environment variables

Open `render-env.txt` (generated locally, git-ignored), copy all of it, and use
Render's **Add from .env** button to paste it in one go.

Two values to check:

```
SERVER_URL=https://sweet-lavaa.onrender.com   <- must match your actual Render URL
CLIENT_URL=                                    <- not needed for single-service; safe to delete
```

`VITE_API_URL` is **not** set on Render. The client is built with the relative default `/api`,
which resolves to the same service.

---

## 3. Deploy and verify

Click **Deploy**. The first build takes 3-6 minutes.

Then check both halves on the one URL:

```
https://sweet-lavaa.onrender.com/api/health   -> {"success":true,...}
https://sweet-lavaa.onrender.com/             -> the storefront
https://sweet-lavaa.onrender.com/products     -> loads directly (SPA fallback works)
```

---

## 4. Redeploys

Every push to `main` triggers a rebuild automatically.

## 5. Seed the production database

Run once, from your machine, pointed at the production database:

```bash
cd server
# temporarily point MONGODB_URI at the production cluster, then:
npm run seed
```

**This wipes the database first.** Only do it on a fresh deployment.

Afterwards, sign in as the seeded admin and immediately change its password from
**Admin → My profile**. The seeded credentials are published in this repository.

---

## 6. Update Google OAuth for production

[console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) -> your
OAuth client -> **Authorised JavaScript origins** -> add your Render URL:

```
https://sweet-lavaa.onrender.com
```

Keep `http://localhost:5173` so local development keeps working.

While you are there, **Audience** → **Publish app** if you want anyone other than your test users
to be able to sign in.

---

## 7. Paymob

This is the step that needed a tunnel locally. With a deployed backend it is straightforward,
because Render gives you a public HTTPS URL.

In the Paymob dashboard → **Developers** → **Payment Integrations** → edit your integration:

```
Transaction processed callback : https://sweet-lavaa.onrender.com/api/payments/paymob/webhook
Transaction response callback  : https://sweet-lavaa.onrender.com/api/payments/paymob/callback
```

Then add the four Paymob variables to Render's environment and verify:

```bash
npm run paymob:check
```

One caveat specific to Render's free plan: if the service is asleep when Paymob posts the webhook,
the request may time out. Paymob retries, and the redirect handler independently re-fetches the
transaction, so an order still settles correctly — but a paid plan avoids the delay entirely.

---

## Checklist

| | Local | Production |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` |
| `CLIENT_URL` | `http://localhost:5173` | Vercel URL |
| `SERVER_URL` | `http://localhost:5000` | Render URL |
| `VITE_API_URL` | `http://localhost:5000/api` | Render URL + `/api` |
| JWT secrets | local values | **freshly generated** |
| Google origins | `http://localhost:5173` | both |
| Paymob callbacks | tunnel URL | Render URL |

---

## Troubleshooting

**CORS error in the browser console**
`CLIENT_URL` on Render does not exactly match the Vercel origin. No trailing slash, and `https://`.

**404 when refreshing on `/products`**
`client/vercel.json` was not picked up — check that Vercel's Root Directory is `client`.

**First request takes ~50 seconds**
Render free plan cold start. Expected.

**`Missing required environment variables` in Render logs**
`MONGODB_URI` or `JWT_SECRET` was not set in the Render environment.

**Login works but every later request is 401**
`VITE_API_URL` is wrong, or the frontend was built before the variable was set. Vercel bakes
env vars at build time — change the variable, then **Redeploy**.

**Google button shows `origin is not allowed`**
The production origin was not added in Google Cloud Console, or it has not propagated yet
(Google allows up to a few hours).
