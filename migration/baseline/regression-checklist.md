# PAP feature-parity regression baseline

## Commerce

- Product listing/detail use real API product data.
- Search, Pet Type, category, age, price, stock toggle, favorites, and sorting combine correctly.
- Cart quantities never exceed stock and deleted products are pruned safely.
- Login/session, checkout validation, atomic order creation, stock decrement, customer orders, and admin orders work.
- Admin authentication, product CRUD, upload replacement/deletion, and legacy image URLs work.

## PAP experience

- Cat, Dog, and Both Pet Modes retain distinct themes and eligibility boundaries.
- Mascot walk, idle, sit, sleep, curious, happy, card climbing, cursor tracking, pause/resume, and cleanup work.
- Feed/Pet locking, Fake Pet Chat, typing delay, Mood Assessment, and Chaos cleanup work.
- Horror Mode remains a separate landing Easter Egg with no normal shop UI and reload-only exit.

## Preferences and accessibility

- TH/EN, Light/Dark, sound preference, first-paint protection, mobile layout, keyboard focus, and reduced motion work.
- No duplicate listeners, timers, animation frames, observers, or temporary DOM survive teardown.
- Admin does not receive customer mascot/chat features.

## Persistence and rollback

- Existing SQLite schema/data and `/uploads/products/*` URLs remain compatible.
- Legacy application remains runnable from the frozen checkpoint.
- Staging uses copies only; Production data and uploads are not used during M0/M1.
- Every later migration phase must have API, browser, and rollback verification before cutover.

## M1 acceptance

- FastAPI health test passes.
- React Router renders `/` and `/health`.
- React health UI reaches FastAPI through the Vite proxy.
- Frontend production build succeeds.
- No legacy implementation file changes.
