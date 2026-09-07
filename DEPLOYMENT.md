# Deploying Sweet Lava

**API on Railway or Render, frontend on Vercel**, database on MongoDB Atlas, media on Cloudinary.

There is a chicken-and-egg problem: the API needs the frontend URL (for CORS) and the frontend
needs the API URL. Deploy the API first with a placeholder, then fix it in step 4.

---

## 0. Push to GitHub

```bash
git add -A
git commit -m "your message"
git push
```

`.gitignore` excludes `.env`, `render-env.txt` and `railway-env.txt`, so no secrets are committed.

---

## 1. Deploy the API — Railway (recommended) or Render

Pick one. Railway never sleeps, so the first customer of the day does not wait for a
cold start; Render's free plan does, and its paid plan is a flat $7.

<details open>
<summary><strong>Option A — Railway</strong></summary>

[railway.com](https://railway.com) -> **New Project** -> **Deploy from GitHub repo** -> `sweet-lavaa`.

Then open the service -> **Settings**:

| Field | Value |
| --- | --- |
| **Root Directory** | `server` (recommended) or leave empty |
| Branch | `main` |
| Build / Start | leave empty — a `railway.json` sets them |

There is a `railway.json` at the repo root **and** in `server/`, so the service builds and starts
correctly either way. Railway reads the one inside whatever Root Directory is set.

`server/railway.json` pins the build command, the start command and `/api/health` as the
healthcheck, so a broken deploy is rolled back instead of served.

Under **Settings -> Networking**, click **Generate Domain** and copy the URL.

### Environment variables

Open `railway-env.txt` (generated locally, git-ignored), then in Railway:
**Variables -> Raw Editor -> paste the whole file.**

Two rules:

- **Never add `PORT`.** Railway injects it; hardcoding it makes the healthcheck fail.
- Set `SERVER_URL` to the domain you just generated.

> **Root Directory is not optional.** Left empty, Railway deploys the repo root, installs only
> the root `package.json` (which has no dependencies), then runs its `start` script — which
> delegates into `server/` where nothing is installed. The container crash-loops on
> `Cannot find package 'express'` and the healthcheck reports `service unavailable`, because the
> process dies before it ever listens.

</details>

<details>
<summary><strong>Option B — Render</strong></summary>



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
> The $7 Starter plan stays awake.

</details>

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
VITE_API_URL=https://<your-api-domain>/api
VITE_GOOGLE_CLIENT_ID=527915991868-....apps.googleusercontent.com
```

`VITE_API_URL` **must end with `/api`** and point at the domain from step 1
(`*.up.railway.app` or `*.onrender.com`).

Deploy, then copy the Vercel URL.

> Vite bakes env vars at build time. If you change one later, you must **Redeploy** —
> saving the variable alone does nothing.

---

## 3. Point the API back at Vercel

In your API host's environment (Railway **Variables**, Render **Environment**), set:

```
CLIENT_URL=https://sweet-lavaa.vercel.app
```

Save; the service redeploys. Without this, every request from the frontend fails CORS with a 403.

`CLIENT_URL` accepts a comma-separated list for a custom domain later:

```
CLIENT_URL=https://sweetlava.com,https://sweet-lavaa.vercel.app
```

Vercel preview deployments (`*.vercel.app`) are allowed automatically.

---

## 4. Check it end to end

Open the Vercel URL. The storefront should load products from the API.
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

Verify the ids line up on both sides before you test:

```bash
npm run google:check --prefix server
```

Leave **Authorised redirect URIs** empty — the front end uses the ID-token flow, so Google never
redirects anywhere and that list is not consulted.

While you are there, **Audience** → **Publish app** if you want anyone other than your test users
to be able to sign in.

---

## 7. Fawaterak — currently disabled

> Online payment is **off**: the store is cash on delivery only, and `FAWATERAK_API_KEY`
> is deliberately left empty. Skip this section unless you are switching card payments back on.

This is the step that needed a tunnel locally. With a deployed backend it is straightforward,
because Render gives you a public HTTPS URL.

In the Fawaterak dashboard → **Integration** → **Webhooks**, set:

```
Webhook URL : https://sweet-lavaa.onrender.com/api/payments/fawaterak/webhook
```

The success / fail / pending URLs need no setup — they are sent with every invoice.

Then add the two Fawaterak secrets to Render's environment and verify:

```bash
npm run fawaterak:check
```

Switch `FAWATERAK_BASE_URL` to `https://app.fawaterk.com` and swap in your live keys when you go
live; staging keys do not work against the live host.

One caveat specific to Render's free plan: if the service is asleep when Fawaterak posts the
webhook, the request may time out. The redirect handler independently re-reads the invoice, so an
order still settles correctly — but a paid plan avoids the delay entirely.

---

## Checklist

| | Local | Production |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` |
| `CLIENT_URL` | `http://localhost:5173` | Vercel URL |
| `SERVER_URL` | `http://localhost:5000` | API URL |
| `VITE_API_URL` | `/api` (Vite proxy) | API URL + `/api` |
| `PORT` | `5000` | **unset** — the host injects it |
| JWT secrets | local values | **freshly generated** |
| Google origins | `http://localhost:5173` | both |

---

## Troubleshooting

**CORS error in the browser console**
`CLIENT_URL` on the API does not exactly match the Vercel origin. No trailing slash, and `https://`.

**404 when refreshing on `/products`**
`client/vercel.json` was not picked up — check that Vercel's Root Directory is `client`.

**First request takes ~50 seconds**
Render free plan cold start. Expected.

**`Missing required environment variables` in the deploy logs**
`MONGODB_URI` or `JWT_SECRET` was not set in the service's environment.

**Railway healthcheck fails but the logs say the server started**
A hardcoded `PORT` variable. Delete it — Railway assigns the port and the server reads it.

**The frontend still calls the old API host after switching**
`VITE_API_URL` is baked in at build time. Change it in Vercel, then **Redeploy** — saving alone
does nothing.

**`MongooseServerSelectionError` on the deployed API**
Atlas is blocking the host's IP. Network Access -> add `0.0.0.0/0`; neither Railway nor Render
has a fixed outbound IP on these plans.

**Login works but every later request is 401**
`VITE_API_URL` is wrong, or the frontend was built before the variable was set. Vercel bakes
env vars at build time — change the variable, then **Redeploy**.

**Google button shows `origin is not allowed`**
The production origin was not added in Google Cloud Console, or it has not propagated yet
(Google allows up to a few hours).
