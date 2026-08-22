# Documentation index

Project branding: **pal2paw**. Target runtime: **React → FastAPI → PostgreSQL 16**.

| Task | Read |
| --- | --- |
| Understand current state or production readiness | `PROJECT_STATE.md` |
| Change system boundaries or migration behavior | `ARCHITECTURE.md`, `DECISIONS.md` |
| Change schema, persistence, or database config | `DATABASE.md`, `BACKEND.md` |
| Change login, sessions, or permissions | `AUTH.md`, `BACKEND.md`, `FRONTEND.md` |
| Change customer storefront | `FRONTEND.md`, `BACKEND.md` |
| Change admin UI/API | `FRONTEND.md`, `BACKEND.md`, `AUTH.md` |
| Add or update tests | `TESTING.md`, then the relevant component document |
| Plan deployment or final release | `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DATABASE.md`, `TESTING.md` |

Use source files for exact behavior after narrowing the scope with these documents. Avoid repository-wide scans by default.
