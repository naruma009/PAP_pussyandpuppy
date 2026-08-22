# Testing

## Commands confirmed by repository configuration

From `frontend/`:

- `npm test` — Vitest run
- `npm run build` — Vite production build

For the backend, the repository contains pytest tests under `backend/tests/` and a FastAPI `TestClient` setup. The exact configured backend command/runner entry point is not declared in a project script; use the repository's Python environment and run the targeted pytest module from `backend/` after verifying dependencies.

## Working rules

- Small changes: run targeted frontend or backend tests for the changed contract.
- Milestones: run frontend tests, backend tests, and a production build/full regression.
- Production-critical flows must have tests before final deployment: customer registration/login/logout, authorization bypass attempts, catalog/detail, cart/checkout, stock race/oversell behavior, order history, admin product CRUD/stock, admin order lifecycle, uploads, PostgreSQL integration, secure cookies, and deployment smoke tests.
- Existing tests exercise FastAPI contracts with temporary SQLite databases and frontend behavior with browser-like test environments. They do not prove PostgreSQL or public deployment readiness.

Do not claim a test passed unless it was run and its output was checked.
