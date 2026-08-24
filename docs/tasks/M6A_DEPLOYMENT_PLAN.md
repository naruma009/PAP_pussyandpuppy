# M6A Production Deployment Plan

## Scope and verified facts

This plan is documentation-only. No server, firewall, database, Stripe, or hosting change is made by M6A.

Verified current implementation:

- React/Vite frontend and FastAPI backend are separate development applications.
- PostgreSQL 16 is the canonical database. Development reaches it through `localhost:5434` over an SSH tunnel; PostgreSQL is not public.
- The FastAPI app reads `DATABASE_URL` and other settings from environment configuration, uses SQLAlchemy/Alembic, and serves `/api`, `/uploads/products`, and the health endpoint.
- Session cookies are HttpOnly and SameSite=Lax; `Secure` is enabled when `PAP_API_ENV=production`.
- Stripe Checkout and signed webhook handling are implemented for sandbox/test mode. Stripe credentials are environment-only.
- Product images are written to the configured local `upload_dir` and served by FastAPI under `/uploads/products`.
- No deployment provider or permission to deploy to the shared GCP VM is established in this repository.

## Recommended topology

Use one public HTTPS origin with a reverse proxy on the same VM as the private PostgreSQL service:

```text
Browser
  -> HTTPS reverse proxy / public domain
       -> static React build
       -> /api and /uploads -> FastAPI on localhost
                                -> PostgreSQL on localhost/private interface
```

The backend and PostgreSQL placement avoids the current connectivity blocker: an arbitrary external backend host cannot connect to a database whose port 5432 is not public. The development SSH tunnel is suitable for local work only and is not a maintainable production transport.

This topology requires explicit permission from the shared VM owner before any deployment, service, filesystem, firewall, or process change. M6A does not assume that permission exists.

Alternatives:

- A separately hosted backend would require a private network/VPC route to the VM or a managed database endpoint. Without that network authority it cannot connect safely.
- Making PostgreSQL public would expand attack surface and is not recommended.
- A permanent ad-hoc SSH tunnel would add process supervision, key rotation, failure recovery, and availability problems; it is not the production solution.

## Production blockers and required decisions

### Backend and process

- Choose a process supervisor/container/runtime on the VM. Run Uvicorn/Gunicorn without `--reload` and with production logging/health supervision.
- Bind FastAPI privately (for example localhost) behind the HTTPS reverse proxy.
- Run `alembic upgrade head` as an explicit release step from `backend/` after backup/approval and before starting the new application version. Do not depend on FastAPI startup to mutate production schema.
- Add a database-backed readiness check before release. Current `/api/health` is a liveness response and does not prove PostgreSQL connectivity.

### Frontend and API origin

- Build with `npm run build` and serve `frontend/dist` as static assets.
- Prefer the same public origin for frontend and `/api`; the current client defaults to `/api` and the current backend has no CORS middleware.
- `VITE_DEV_API_TARGET` is development-only. `VITE_API_BASE_URL` should remain `/api` for the same-origin deployment, or be set to the approved HTTPS API origin if a separate origin is deliberately introduced.
- If frontend and API become cross-origin, add an explicit CORS/credentials design and revisit cookie SameSite/domain/CSRF behavior before deployment. Do not infer that from the current code.

### HTTPS and sessions

- Terminate TLS at the reverse proxy, redirect HTTP to HTTPS, and use a real public domain.
- Keep the backend session cookie HttpOnly, Secure, SameSite=Lax, and scoped to the deployment origin. Validate cross-origin/CSRF behavior before changing this policy.
- `PAP_API_SECRET_KEY` must be a long random production secret and must not be rotated casually; rotation invalidates signed sessions.

### Uploads and persistence

Product images currently live under `PAP_API_UPLOAD_DIR` and are served by FastAPI. Local filesystem storage is a production persistence risk if the VM filesystem is ephemeral, replaced, or not backed up.

Minimal first deployment solution: use a dedicated persistent disk/mount on the VM for `PAP_API_UPLOAD_DIR`, restrict write access to the app, serve only the generated upload path, and back it up with the deployment/database process. Object storage/CDN is a later improvement; M6A does not migrate files.

### Stripe

For public sandbox verification, use test keys only and configure:

- `STRIPE_SUCCESS_URL` to the public HTTPS `/payment/success` route.
- `STRIPE_CANCEL_URL` to the public HTTPS `/payment/cancel` route.
- Stripe Dashboard/CLI webhook delivery to the public HTTPS `POST /api/payments/stripe/webhook` endpoint.
- `STRIPE_WEBHOOK_SECRET` for the exact endpoint/environment receiving events.

Production requires separate production credentials, webhook secret, and public URLs. Do not activate live payments in this plan. Webhook signature verification remains mandatory, and browser success/cancel redirects are never payment authority.

## Production environment variables

Values belong in the hosting secret/environment manager, not Git or frontend source.

Required for the recommended production deployment:

- `PAP_API_ENV=production`
- `PAP_API_SECRET_KEY`
- `DATABASE_URL` (private PostgreSQL URL reachable from the VM)
- `PAP_API_UPLOAD_DIR` (persistent absolute path for product images)
- `STRIPE_SECRET_KEY` (test key until sandbox verification is complete; live key is a separate future release)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

Optional or development-only:

- `PAP_API_HOST`, `PAP_API_PORT` — process binding; keep private behind the proxy.
- `PAP_API_DATABASE_PATH` — SQLite fallback for local/test only; not a production database setting when `DATABASE_URL` is present.
- `VITE_API_BASE_URL` — normally `/api` for same-origin production build.
- `VITE_DEV_API_TARGET` — local Vite proxy only; never a production secret or database setting.

M6B1 local hardening adds `PAP_API_PUBLIC_ORIGIN`, comma-separated `PAP_API_CORS_ALLOWED_ORIGINS`, `PAP_API_COOKIE_SAMESITE`, and optional `PAP_API_COOKIE_DOMAIN`. Use the exact backend start command from `docs/BACKEND.md` without `--reload`; run `alembic upgrade head` once as an explicit release step before starting the process. The application does not initialize a production schema at import/startup.

Never expose any `STRIPE_*`, `DATABASE_URL`, or `PAP_API_SECRET_KEY` value to Vite/browser code.

## Security readiness

Ready in current code:

- Session cookie flags are HttpOnly and SameSite=Lax; Secure follows production mode.
- Stripe webhook uses raw request body and signature verification.
- Payment amount/ownership is backend-controlled.
- No secrets are intended in frontend source or committed `.env` files.
- Same-origin deployment avoids the current lack of CORS middleware.

Blocking verification/work before public release:

- Confirm production secret manager and rotation/backup process.
- Confirm HTTPS, proxy headers, cookie behavior, CSRF protection, rate limiting, and session expiry/revocation.
- Add DB readiness/monitoring, structured error handling, backups, and restore testing.
- Confirm Uvicorn/Gunicorn production process settings with reload/debug disabled.
- Confirm public Stripe test webhook delivery, then separately approve any future live-mode change.

M6B1 status: local production hardening is ready, but VM/reverse proxy/HTTPS/public DNS are NOT DEPLOYED. No VM, firewall, network, database schema/data, or Stripe live-mode change was made.

## Release sequence

1. Obtain VM owner permission and choose the reverse proxy/process supervisor.
2. Provision persistent upload storage, secret manager entries, domain, and HTTPS certificates.
3. Build frontend and place the static output behind the proxy; set the approved API base URL.
4. Install backend dependencies from the pinned/ranged project requirements in an isolated environment.
5. Verify PostgreSQL reachability from the VM without exposing port 5432.
6. Back up the database, run `alembic upgrade head`, and verify the revision/readiness check.
7. Start the backend without reload/debug, then verify `/api/health`, catalog, login/session cookies, uploads, and customer/admin authorization.
8. Configure Stripe test webhook/public URLs and run the already-tested sandbox flow.
9. Only after acceptance, define a separate production Stripe approval/change process.
