import { Navigate, createBrowserRouter, useLocation, useSearchParams } from "react-router-dom";
import App from "./App";
import HealthPage from "./pages/HealthPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PetSelectionPage from "./pages/PetSelectionPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import CheckoutPage from "./pages/CheckoutPage";
import CustomerOrdersPage from "./pages/CustomerOrdersPage";
import AdminPage from "./pages/AdminPage";
import AdminProvider from "./features/admin/AdminProvider";
import AdminGuard from "./features/admin/AdminGuard";
import AdminAppShell from "./components/admin/AdminAppShell";

function AdminRoute() {
  return <AdminProvider><AdminGuard><AdminAppShell><AdminPage /></AdminAppShell></AdminGuard></AdminProvider>;
}

function LegacyProductAlias() {
  const [params] = useSearchParams();
  const location = useLocation();
  const id = params.get("id");
  params.delete("id");
  const search = params.toString();
  return <Navigate replace to={{ pathname: id ? `/products/${encodeURIComponent(id)}` : "/products", search: search ? `?${search}` : "", hash: location.hash }} />;
}

function LegacyAlias({ to }) {
  const location = useLocation();
  return <Navigate replace to={{ pathname: to, search: location.search, hash: location.hash }} />;
}

export const routes = [
  { path: "/", element: <PetSelectionPage /> },
  { path: "/index.html", element: <LegacyAlias to="/" /> },
  {
    path: "/",
    element: <App />,
    children: [
      { path: "home", element: <HomePage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "account/orders", element: <CustomerOrdersPage /> },
      { path: "health", element: <HealthPage /> },
      { path: "home.html", element: <LegacyAlias to="/home" /> },
      { path: "products.html", element: <LegacyAlias to="/products" /> },
      { path: "product.html", element: <LegacyProductAlias /> },
      { path: "cart.html", element: <LegacyAlias to="/cart" /> },
      { path: "login.html", element: <LegacyAlias to="/login" /> },
      { path: "checkout.html", element: <LegacyAlias to="/checkout" /> },
    ],
  },
  { path: "/admin", element: <AdminRoute /> },
  { path: "/admin.html", element: <LegacyAlias to="/admin" /> },
  { path: "*", element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
