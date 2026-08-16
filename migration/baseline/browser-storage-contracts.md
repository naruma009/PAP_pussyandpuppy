# Browser storage contracts

These keys must be preserved until an explicitly approved migration changes them.

## localStorage

| Key | Responsibility |
| --- | --- |
| `pap-mode` | `cat`, `dog`, or `both` |
| `pap-theme` | `light` or `dark` |
| `pap-language` | `th` or `en` |
| `pap-sound` | sound preference |
| `pap-cart` | array of `{ id, qty }` |
| `pap-favorites-v1` | array of product IDs; device-only, not account synced |
| `pap-customer` | last checkout shipping draft |
| `pap-backend-migrated` | legacy product migration marker |

## sessionStorage

| Key | Responsibility |
| --- | --- |
| `pap-mode` | legacy/fallback Pet Mode value |
| `pap-after-login` | post-login redirect target |
| `pap-product-filters-{mode}` | Products discovery state |
| `pap-product-filters-{mode}-featured` | featured-view discovery state |

## Server sessions

- Customer session contains `{ name, email }`; there is no customer database table.
- Admin session contains an authenticated boolean.
- Flask and FastAPI session cookies are not assumed to be binary-compatible.
