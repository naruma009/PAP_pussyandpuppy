# Architecture

## Current implementation

The current migration stack is:

`React/Vite frontend → FastAPI backend → SQLite database`

The frontend calls `/api` with same-origin credentials. Vite proxies `/api` and `/uploads` to a local FastAPI target during development. FastAPI serves product uploads and uses session middleware.

Backend modules are grouped under `backend/app/`: route modules, configuration, SQLite access, serializers, sessions, and upload handling.

## Legacy implementation

The legacy stack remains at the repository root:

`Vanilla HTML/JS/CSS → Flask app.py → SQLite + filesystem uploads`

The legacy database is `instance/pap.db`; legacy uploads are under `uploads/products`. FastAPI explicitly rejects those paths in its runtime validation. Keep the legacy runtime independently runnable until controlled cutover.

## Target architecture

`React frontend → FastAPI backend → PostgreSQL 16`

The target must be a real deployable web application, not a demo or localhost-only setup. The frontend, backend, and database must be deployable for other users without a developer machine or temporary tunnel.

The migration is not a reason to restart from scratch. Extend the current React/FastAPI implementation only after checking whether the relevant flow already exists, and retire legacy paths only through an explicit cutover plan.

## Boundaries to preserve

- Frontend controls presentation and client state; it must not be the authority for permissions, stock, order totals, or identity.
- FastAPI owns API validation, authentication/authorization decisions, stock/order transactions, and database access.
- PostgreSQL is the target system of record. Exact connection/pooling/deployment design is TBD.
- Legacy Flask/Vanilla code is compatibility or migration scope, not the target for new feature work when a React/FastAPI equivalent exists.
