<!-- MANUAL SYNC REQUIRED: Keep this file synchronized with AGENTS.md. -->

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

## MANDATORY: Branch Per Task

- `main` is production. Promote to `main` only through a promotion PR from `uat`.
- `uat` is the stable preview/UAT branch. Promote to `uat` only through a PR from `develop`.
- `develop` is the integration branch. Feature, fix, and chore PRs target `develop` only.
- `feat/*`, `fix/*`, and `chore/*` branches contain one task per branch.
- Always branch from an updated `develop` branch.
- Never commit directly to `develop`, `uat`, or `main`.
- Delete task branches after merge, but never delete long-lived `develop`, `uat`, or `main`.
- Keep automatic head-branch deletion off.
- Before deleting a branch, check unmerged remote branches and prefer `git branch -d` over `git branch -D`.
- Before merging an old PR, check for semantic collisions with work already merged or in flight.
- Before database changes, check that Alembic has no multiple heads.
- New environment variables must exist in both Vercel Preview and Vercel Production.
- Migrations are explicit and manual; never run them automatically as an application startup side effect.
- Never touch the retired Flask stack unless the task explicitly requires it.
- Never commit secrets. Anything named `VITE_*` is public and must be treated as non-secret.
