# Legacy routes and React page targets

| Legacy URL | Current responsibility | Future React target |
| --- | --- | --- |
| `/` and `/index.html` | Pet selection and Horror entry | `PetSelectionPage` |
| `/home.html` | Home and featured products | `HomePage` |
| `/products.html` | Discovery, search, filters, favorites | `ProductsPage` |
| `/product.html?id={id}` | Product detail | `ProductDetailPage` |
| `/cart.html` | Browser-local cart | `CartPage` |
| `/login.html` | Demo customer session | `LoginPage` |
| `/checkout.html` | Shipping and order placement | `CheckoutPage` |
| `/admin.html` | Admin session, products, uploads, orders | `AdminPage` |

Legacy URLs must remain valid during migration. Canonical React routes may be introduced later only with compatibility aliases or redirects.

## M1 React routes

| Route | Purpose |
| --- | --- |
| `/` | Migration scaffold status |
| `/health` | Browser-visible backend health proof |
