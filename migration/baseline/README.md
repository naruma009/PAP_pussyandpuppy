# PAP migration baseline

This directory records the contracts that the parallel React and FastAPI implementation must preserve.

- Baseline commit: `8dae5fe4884784d56a2c6647226ef26100363498`
- Legacy runtime: static multi-page frontend, Flask JSON API, SQLite, filesystem uploads
- Migration branch: `react-fastapi-migration`
- Goal: feature parity, not redesign

## Safety boundaries

- Keep all legacy HTML, JavaScript, CSS, and `app.py` unchanged during M0/M1.
- Do not connect the new backend to the Production database or uploads in M0/M1.
- Do not run schema migration or legacy migration endpoints.
- Keep the legacy application independently runnable until controlled cutover.
- Do not permit Flask and FastAPI to write the same SQLite file concurrently.

## M1 proof only

M1 proves this path and no other feature:

`React -> Vite /api proxy -> FastAPI GET /api/health`

Products, cart, authentication, checkout, orders, admin, uploads, mascot, chat, mood, and chaos remain out of scope.
