# Deploying Sweet Lava

Backend on **Render**, frontend on **Vercel**, database on **MongoDB Atlas**, media on **Cloudinary**.

There is a chicken-and-egg problem: the backend needs to know the frontend URL (for CORS) and the
frontend needs to know the backend URL. The order below deals with it — deploy the backend first
with a placeholder, then come back and fix it in step 4.

---

## 0. Push to GitHub

Both hosts deploy from a repository.

```bash
cd d:\sweet-lava
git init
git add .
git commit -m "Sweet Lava"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sweet-lava.git
git push -u origin main
```

`.gitignore` already excludes `.env`, so no secrets are committed. Confirm before pushing:

```bash
git status --porcelain | findstr ".env"
```

That should print nothing.

---

## 1. Prepare Atlas for production

Your cluster currently allows connections from anywhere, which was fine locally.

1. **Network Access** → keep `0.0.0.0/0`. Render does not publish static outbound IPs on the free
   plan, so restricting by IP is not practical there. The database is still protected by its
   username and password.
2. Consider a separate database user for production with a fresh password.

---

## 2. Deploy the backend to Render

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service** → connect your repo.
2. Settings:

   | Field | Value |
   | --- | --- |
   | Root Directory | `server` |
   | Runtime | Node |
   | Build Command | `npm ci` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/health` |

3. **Environment** → add every variable from your local `server/.env`, with these changes:

   ```
   NODE_ENV=production
   CLIENT_URL=https://placeholder.vercel.app     ← fixed in step 4
   SERVER_URL=https://sweet-lava-api.onrender.com ← your own Render URL
   ```

   Generate **fresh** secrets for production rather than reusing the local ones:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Do that three times, for `JWT_SECRET`, `JWT_REFRESH_SECRET` and `COOKIE_SECRET`.

4. **Create Web Service**, wait for the build, then confirm:

   ```
   https://YOUR-API.onrender.com/api/health
   ```

   You should get `{"success":true,...}`. **Copy this URL.**

> The free plan sleeps after 15 minutes of inactivity. The first request afterwards takes
> roughly 50 seconds while it wakes up. That is normal, not a bug.

---

## 3. Deploy the frontend to Vercel

1. [vercel.com/new](https://vercel.com/new) → import the same repo.
2. Set **Root Directory** to `client`. Vercel reads the rest from `client/vercel.json`.
3. **Environment Variables**:

   ```
   VITE_API_URL=https://YOUR-API.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=527915991868-....apps.googleusercontent.com
   ```

   Note `VITE_API_URL` ends with `/api`.

4. **Deploy**, then copy the resulting URL, e.g. `https://sweet-lava.vercel.app`.

---

## 4. Connect the two

Back in **Render** → **Environment** → set:

```
CLIENT_URL=https://sweet-lava.vercel.app
```

Save. Render redeploys automatically.

`CLIENT_URL` accepts a comma-separated list if you add a custom domain later:

```
CLIENT_URL=https://sweetlava.com,https://sweet-lava.vercel.app
```

Vercel preview deployments (`*.vercel.app`) are allowed automatically.

---

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

[console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) → your
OAuth client → **Authorised JavaScript origins** → add:

```
https://sweet-lava.vercel.app
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
Transaction processed callback : https://YOUR-API.onrender.com/api/payments/paymob/webhook
Transaction response callback  : https://YOUR-API.onrender.com/api/payments/paymob/callback
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
