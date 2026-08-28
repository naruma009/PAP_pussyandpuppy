# Architecture

## Current implementation

The active stack is:

```text
React/Vite frontend
  -> same-origin /api
  -> FastAPI
       -> SQLAlchemy 2 / PostgreSQL (Supabase target)
       -> Supabase Storage (product images)
```

SQLite remains a local/test compatibility database. Vite proxies `/api` to
FastAPI during development. In Vercel, `api/index.py` exposes the ASGI app and
`vercel.json` routes API requests without changing their `/api/*` paths.

PostgreSQL runtime engines use `NullPool` and disable psycopg prepared
statements so Vercel functions can use the Supabase transaction pooler safely.
Product upload helpers send bytes directly to the public `product-images`
bucket and return full public URLs; FastAPI no longer mounts a local upload
directory.

## Deployment topology

```text
Browser
  -> Vercel HTTPS origin
       -> React static assets / SPA fallback
       -> /api/* FastAPI function
              -> Supabase transaction pooler (runtime)
              -> Supabase Storage
              -> Stripe Checkout test mode
```

Alembic is run manually from a trusted environment against the Supabase direct
connection, never as a Vercel startup side effect. The RLS migration denies
public REST access to application tables while backend database access remains
server-side.

## Legacy implementation

The retired stack remains at the repository root:

`Vanilla HTML/JS/CSS → Flask app.py → SQLite + filesystem uploads`

It is retained for reference and excluded from Vercel by `.vercelignore`.
FastAPI still rejects legacy database/upload paths. Do not modify or deploy the
legacy stack unless an explicit cutover task authorizes it.

## Boundaries to preserve

- Frontend controls presentation and client state, not permissions, stock,
  totals, payment authority, or identity.
- FastAPI owns API validation, authentication/authorization, transactions,
  database access, Stripe verification, and Storage credentials.
- Secrets remain server-side and must never use a `VITE_*` variable.
- Preview and Production use the same-origin cookie design and require their
  own complete Vercel environment-variable scopes.
- Schema changes use explicit Alembic migrations against the direct database
  connection; runtime traffic uses the transaction pooler.
