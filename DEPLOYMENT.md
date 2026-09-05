# Deploying Sweet Lava

**API on Render, frontend on Vercel**, database on MongoDB Atlas, media on Cloudinary.

There is a chicken-and-egg problem: the API needs the frontend URL (for CORS) and the frontend
needs the API URL. Deploy the API first with a placeholder, then fix it in step 4.

---

## 0. Push to GitHub

```bash
git add -A
git commit -m "your message"
git push
```

`.gitignore` excludes `.env` and `render-env.txt`, so no secrets are committed.

---

## 1. Deploy the API to Render

[dashboard.render.com](https://dashboard.render.com) -> **New** -> **Web Service** -> connect the repo.

| Field | Value |
| --- | --- |
| Name | `sweet-lavaa` |
| Language | Node |
| Branch | `main` |
| Region | Frankfurt (EU Central) |
| **Root Directory** | `server` |
| **Build Command** | `npm ci` |
| **Start Command** | `npm start` |
| Health Check Path | `/api/health` |
| Instance Type | Free |

### Environment variables

Open `render-env.txt` (generated locally, git-ignored), copy it, and use Render's
**Add from .env** button to paste everything at once.

Check these two:

```
SERVER_URL=https://sweet-lavaa.onrender.com    <- must match your Render URL
CLIENT_URL=https://PLACEHOLDER.vercel.app      <- corrected in step 4
```

### Verify

```
https://sweet-lavaa.onrender.com/api/health   -> {"success":true,...}
```

The root URL returns a small JSON banner — that is expected, the storefront lives on Vercel.

**Copy the Render URL.**

> The free plan sleeps after 15 minutes idle. The next request takes ~50 seconds to wake it.

---

## 2. Deploy the frontend to Vercel

[vercel.com/new](https://vercel.com/new) -> import the same repo.

| Field | Value |
| --- | --- |
| **Root Directory** | `client` |
| Framework | Vite (detected) |

Everything else comes from `client/vercel.json`, including the SPA rewrite that makes
`/products` work on a hard refresh.

### Environment variables

```
VITE_API_URL=https://sweet-lavaa.onrender.com/api
VITE_GOOGLE_CLIENT_ID=527915991868-....apps.googleusercontent.com
```

`VITE_API_URL` **must end with `/api`** and point at Render.

Deploy, then copy the Vercel URL.

> Vite bakes env vars at build time. If you change one later, you must **Redeploy** —
> saving the variable alone does nothing.

---

## 3. Point Render back at Vercel

Render -> **Environment** -> set:

```
CLIENT_URL=https://sweet-lavaa.vercel.app
```

Save; Render redeploys. Without this, every request from the frontend fails CORS with a 403.

`CLIENT_URL` accepts a comma-separated list for a custom domain later:

```
CLIENT_URL=https://sweetlava.com,https://sweet-lavaa.vercel.app
```

Vercel preview deployments (`*.vercel.app`) are allowed automatically.

---

## 4. Check it end to end

Open the Vercel URL. The storefront should load products from Render.
If it is empty, open DevTools -> Network and look for CORS errors, then re-check step 3.

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
OAuth client -> **Authorised JavaScript origins** -> add the **Vercel** origin
(the Google button runs in the browser, so it is the frontend origin that matters,
not the API one):

```
https://sweet-lavaa.vercel.app
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
| `VITE_API_URL` | `/api` (Vite proxy) | Render URL + `/api` |
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
