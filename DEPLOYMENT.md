# Deploy pal2paw to Vercel and Supabase

This guide deploys the current React/Vite frontend and FastAPI backend from one
Vercel project and uses Supabase PostgreSQL and Storage. The retired root Flask
application is retained in Git for reference and is excluded from Vercel.

## Production topology

```text
Browser
  -> one Vercel HTTPS origin
       -> React static build
       -> /api/* -> FastAPI Python function
                       -> Supabase PostgreSQL transaction pooler
                       -> Supabase Storage product-images bucket
                       -> Stripe Checkout test mode
```

Keeping the frontend and API on one origin preserves the existing HttpOnly,
Secure, SameSite=Lax session-cookie design. Do not put backend secrets in
`VITE_*` variables; Vite embeds those values in public JavaScript.

## 1. Prepare Supabase

Create a Supabase project and a public Storage bucket named `product-images`.
Keep these values outside Git:

- Project URL.
- Modern backend secret key (`sb_secret_...`).
- Direct PostgreSQL connection URL on port 5432 for migrations.
- Transaction-pooler PostgreSQL URL on port 6543 for Vercel runtime.
- Publishable/anon key used only for the RLS security probe.

Use the direct connection from `backend/` to apply migrations explicitly:

```powershell
$env:DATABASE_URL = "<direct-postgresql-url-port-5432>?sslmode=require"
& '.\.venv\Scripts\python.exe' -m alembic upgrade head
& '.\.venv\Scripts\python.exe' -m alembic current
```

The expected head is `m5b1_rls`. It enables Row Level Security without public
policies on `users`, `products`, `orders`, `order_items`, and `settings`.
FastAPI connects with the database role in `DATABASE_URL`; public REST clients
must not be able to read application rows.

Verify RLS with the publishable/anon key, never the backend secret key:

```powershell
curl.exe "https://<project-ref>.supabase.co/rest/v1/users?select=*" `
  -H "apikey: <publishable-or-anon-key>"
```

An empty array or an authorization error is acceptable. Any returned user row
is a release blocker.

## 2. Prepare Stripe test mode

Use Stripe test mode only. Keep the test secret key outside Git. The webhook
endpoint can be created after Vercel provides the stable deployment domain:

```text
https://<deployment-domain>/api/payments/stripe/webhook
```

Subscribe only to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Store the endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`. A webhook
signing secret belongs to one endpoint; create a new endpoint/secret if the
domain changes.

## 3. Create the Vercel project

Import this GitHub repository into Vercel with:

- Root Directory: `.`
- Framework Preset: `Other`
- Production Branch: `main`
- Install/build behavior: use the committed `vercel.json`

`api/index.py` exposes the FastAPI ASGI app. `vercel.json` routes `/api/*` to
that function, serves the React build, and falls back to `index.html` for SPA
routes. `.vercelignore` excludes the retired Flask stack and local/test data.

Configure a stable Preview Branch Domain for `uat`. Task branches and
`develop` use preview deployments; `main` is the live production branch.

## 4. Configure environment variables

Add every variable to both Vercel Preview and Production scopes. Values may
differ by scope, but a required name must not be absent from either scope.

| Variable | Value/purpose |
| --- | --- |
| `PAP_API_ENV` | `production` |
| `PAP_API_SECRET_KEY` | Stable random value of at least 64 characters |
| `DATABASE_URL` | Supabase transaction pooler URL on port 6543 with `sslmode=require` |
| `PAP_API_PUBLIC_ORIGIN` | Exact HTTPS deployment origin for that scope |
| `PAP_API_UPLOAD_DIR` | `/tmp/uploads`; retained only for compatibility checks |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Modern `sb_secret_...` backend key |
| `SUPABASE_STORAGE_BUCKET` | `product-images` |
| `STRIPE_SECRET_KEY` | Stripe test secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the exact webhook endpoint |
| `STRIPE_SUCCESS_URL` | `https://<origin>/payment/success` |
| `STRIPE_CANCEL_URL` | `https://<origin>/payment/cancel` |

Do not configure `PAP_API_DATABASE_PATH` in Vercel. Do not configure
`VITE_API_BASE_URL` for this same-origin deployment; the frontend defaults to
`/api`. The backend accepts `SUPABASE_SERVICE_ROLE_KEY` as a legacy alias, but
new deployments should use `SUPABASE_SECRET_KEY`.

## 5. Deploy and verify Preview

Authenticate and link the repository, then deploy the task/develop branch:

```powershell
npx vercel login
npx vercel link
npx vercel
```

Before promotion, verify the returned Preview URL:

1. `GET /api/health` returns 200.
2. `GET /api/ready` returns 200 and proves database connectivity.
3. `GET /api/products` returns 200.
4. Refreshing `/products` returns the React app, not 404.
5. Customer registration/login sets an HttpOnly, Secure session cookie.
6. Admin product create/replace/delete works with a real Storage image URL.
7. A Stripe test Checkout flow updates payment state only after a signed webhook.
8. The publishable/anon Supabase REST probe returns no application rows.

Do not promote to `main` until the complete Preview checklist passes.

## 6. Bootstrap an administrator

Run the interactive command locally against the direct port-5432 connection;
do not run it as a Vercel function:

```powershell
Set-Location backend
$env:DATABASE_URL = "<direct-postgresql-url-port-5432>?sslmode=require"
& '.\.venv\Scripts\python.exe' -m app.bootstrap_admin
```

The password prompt intentionally does not echo. Verify the new account at
`/admin` on Preview before production promotion.

## 7. Promotion and rollback

- Merge task branches into `develop` through feature PRs.
- Promote `develop` to `uat` through a promotion PR.
- Promote `uat` to `main` only after UAT acceptance; merging to `main` deploys
  to customers immediately.
- Never delete `develop`, `uat`, or `main` after promotion merges.
- Run new Alembic migrations manually against the direct connection before
  code that requires them reaches production.
- Roll back application code through a reviewed revert/promotion. Database
  rollback requires a separate reviewed migration decision and backup check.

## Current release status

The repository contains Vercel packaging, serverless-safe PostgreSQL engine
configuration, Supabase Storage integration, and RLS migration code. A public
Vercel Preview, Stripe webhook delivery, runtime database readiness, and admin
bootstrap must still be verified in the target hosted environments before this
release is considered deployed.
