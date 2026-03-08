# Migration to your domain and new accounts

Use this checklist to move Doorstep Laundry to your own domain, email, and production accounts.

**Before you start:** Have your new domain ready (e.g. `doorsteplaundry.com` or `laundry.yourdomain.com`) and use it everywhere you’re asked for a URL or redirect.

---

## 1. Supabase (database)

**Create a new project under your account:**

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account with your domain email).
2. **New project** → pick org, name (e.g. `doorstep-laundry`), strong DB password, region.
3. Wait for the project to finish provisioning.

**Get the connection string:**

1. Project **Settings** → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the URI and replace the `[YOUR-PASSWORD]` placeholder with your database password.
4. **For Vercel/serverless:** Use the **Connection pooling** (Transaction) URI if shown (port `6543`), so you don’t exhaust connections. Otherwise the direct URI (port `5432`) is fine for small traffic.
5. If the password has special characters (`?`, `#`, `&`, `%`), [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them in the string (e.g. `#` → `%23`).

**Env var:**

- `DATABASE_URL` = that full URI (e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` or the direct URL).

**Schema in the new DB:**

- Your app uses Prisma. Point `.env` at the new `DATABASE_URL`, then run:
  - `npx prisma migrate deploy`
- That applies all migrations to the new Supabase database. No need to recreate the project manually.

---

## 2. Stripe

**Create a new Stripe account (or use an existing one under your business):**

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and sign up / log in with your domain email.
2. Complete account verification and (for live payments) identity/business details when you’re ready to go live.

**Keys:**

1. **Developers** → **API keys**.
2. For local and preview: use **Test mode** keys.
3. For production: switch to **Live mode** and use the live keys.
4. Copy:
   - **Secret key** (starts with `sk_test_` or `sk_live_`).
   - **Publishable key** (starts with `pk_test_` or `pk_live_`).

**Webhook (so Stripe can notify your app):**

1. **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:**
   - Production: `https://yourdomain.com/api/webhooks/stripe`
   - Or your Vercel URL: `https://your-app.vercel.app/api/webhooks/stripe`
3. **Events to send:** pick what you use (e.g. `checkout.session.completed`, `payment_intent.succeeded` — match what your `api/webhooks/stripe` handler expects).
4. **Add endpoint** → reveal **Signing secret** (starts with `whsec_`).

**Env vars:**

- `STRIPE_SECRET_KEY` = Secret key.
- `STRIPE_WEBHOOK_SECRET` = Webhook signing secret (use the one for the environment that hits that URL).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Publishable key.

**Important:** Use test keys and a test webhook for staging/preview; use live keys and a live webhook only for production.

---

## 3. NextAuth (app auth)

**Env vars (no new “account”, just config):**

- `NEXTAUTH_SECRET`: Generate a new one for production:  
  `openssl rand -base64 32`
- `NEXTAUTH_URL`:
  - Local: `http://localhost:3000`
  - Production: `https://yourdomain.com` (or `https://your-app.vercel.app`) — **no trailing slash**

In **Vercel** (and any other host), set these in the project’s environment variables for the right environment (Production / Preview).

**If you use Google sign-in:** see the Google section below; then set `NEXTAUTH_URL` to the same domain you use in Google’s redirect URIs.

---

## 4. Resend (email)

**Account and domain:**

1. Go to [resend.com](https://resend.com) and sign up with your domain email.
2. **Domains** → **Add domain** → enter your domain (e.g. `yourdomain.com`).
3. Add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider. Verify in Resend.

**API key and from address:**

1. **API Keys** → **Create API key** → name it (e.g. “Doorstep Laundry”), copy the key (starts with `re_`).
2. Send from an address on your verified domain, e.g. `notifications@yourdomain.com` or `hello@yourdomain.com`.

**Env vars:**

- `RESEND_API_KEY` = the new API key.
- `RESEND_FROM_EMAIL` = e.g. `Doorstep Laundry <notifications@yourdomain.com>` or just `notifications@yourdomain.com`.

---

## 5. Twilio (SMS)

**Account:**

1. Go to [twilio.com](https://twilio.com) and sign up with your domain email.
2. Complete verification. For production you’ll move off trial (verify a number, then buy or port a number).

**Phone number:**

1. **Phone numbers** → **Manage** → **Buy a number** (or use a number you already have).
2. Pick a number that supports SMS in the country you need.
3. Note the number in E.164 form (e.g. `+15551234567`).

**Keys:**

1. **Account** → **API keys & tokens** (or Console → Account).
2. Create an API key or use the **Account SID** and **Auth Token** from the console.

**Env vars:**

- `TWILIO_ACCOUNT_SID` = Account SID (starts with `AC`).
- `TWILIO_AUTH_TOKEN` = Auth token.
- `TWILIO_PHONE_NUMBER` = Your Twilio number in E.164 (e.g. `+15551234567`).

**Trial:** Trial accounts can only send to verified numbers. For production, upgrade and use your purchased number.

---

## 6. Google (OAuth + Maps, optional)

**Google Cloud project (one project can hold both OAuth and Maps):**

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (e.g. “Doorstep Laundry”) or use an existing one under your account.

**OAuth (sign-in with Google):**

1. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
2. If prompted, configure the **OAuth consent screen** (external, your domain email as dev contact).
3. Application type: **Web application**.
4. **Authorized JavaScript origins:**  
   - `https://yourdomain.com`  
   - `http://localhost:3000` (for local)
5. **Authorized redirect URIs:**  
   - `https://yourdomain.com/api/auth/callback/google`  
   - `http://localhost:3000/api/auth/callback/google`
6. Create → copy **Client ID** and **Client secret**.

**Maps (route optimization):**

1. **APIs & Services** → **Library** → enable **Directions API**.
2. **Credentials** → **Create credentials** → **API key** → restrict to Directions API (and optionally HTTP referrers or IPs).
3. Ensure billing is set up (required for Directions; free tier is usually enough).

**Env vars:**

- `GOOGLE_CLIENT_ID` = OAuth client ID.
- `GOOGLE_CLIENT_SECRET` = OAuth client secret.
- `NEXT_PUBLIC_GOOGLE_ENABLED` = `true` if you want the “Sign in with Google” button (omit or `false` to hide it).
- `GOOGLE_MAPS_API_KEY` = Maps API key.

---

## 7. Vercel (hosting and env)

**Domain:**

1. Project on Vercel → **Settings** → **Domains**.
2. Add your domain (e.g. `yourdomain.com` or `app.yourdomain.com`).
3. Add the DNS records Vercel shows at your registrar (A/CNAME/ALIAS as instructed).

**Environment variables:**

1. **Settings** → **Environment Variables**.
2. Add every variable from the sections above for the right environment (Production / Preview):
   - Supabase: `DATABASE_URL`
   - NextAuth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
   - Google (optional): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_ENABLED`, `GOOGLE_MAPS_API_KEY`
3. For Production, set `NEXTAUTH_URL` to `https://yourdomain.com` (no trailing slash).
4. Redeploy after changing env vars.

---

## 8. Local `.env` (do not commit)

Keep a `.env` locally with the same variable names. For local dev:

- `NEXTAUTH_URL=http://localhost:3000`
- Use **test** Stripe keys and **test** webhook URL in Stripe (e.g. `http://localhost:3000/api/webhooks/stripe` with Stripe CLI forwarding).
- Use your **production** Supabase DB only if you’re okay with that, or create a second Supabase project for dev and use its `DATABASE_URL` locally.

Never commit `.env` or paste real keys into docs or chat.

---

## Quick checklist

- [ ] New Supabase project → `DATABASE_URL` → run `prisma migrate deploy`
- [ ] New Stripe account → keys + webhook → `STRIPE_*` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] New `NEXTAUTH_SECRET` + `NEXTAUTH_URL` for production
- [ ] Resend: verify domain, new API key, set `RESEND_FROM_EMAIL` to your domain
- [ ] Twilio: number + credentials → `TWILIO_*`
- [ ] Google (optional): OAuth client + Maps API key → `GOOGLE_*` and `NEXT_PUBLIC_GOOGLE_ENABLED`
- [ ] Vercel: add domain, set all env vars, redeploy

After that, your app runs on your domain with your own Supabase, Stripe, and other accounts.
