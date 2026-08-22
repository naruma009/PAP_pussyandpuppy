# pal2paw AI project map

Read only the documentation relevant to the task; do not scan the whole repository unless the task requires it.

- Overall state, migration boundaries, blockers: `docs/PROJECT_STATE.md`
- System structure and cutover boundaries: `docs/ARCHITECTURE.md`
- Schema, database, and migration rules: `docs/DATABASE.md`
- Customer/admin authentication and authorization: `docs/AUTH.md`
- React routes and UI features: `docs/FRONTEND.md`
- FastAPI routes and backend behavior: `docs/BACKEND.md`
- Test commands and release verification: `docs/TESTING.md`
- Project decisions and constraints: `docs/DECISIONS.md`
- Short task-to-document index: `docs/INDEX.md`

The current branch contains both the React/FastAPI implementation and legacy Vanilla HTML/JS + Flask code. Preserve existing user changes. Do not start a new migration without checking the current implementation and the documented boundaries.
