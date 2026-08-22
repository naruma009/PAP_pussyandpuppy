import { NavLink } from "react-router-dom";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import PreferenceControls from "./PreferenceControls";
import CustomerNavigation from "../commerce/CustomerNavigation";
import { useCommerce } from "../../features/commerce/CommerceProvider";

export default function SiteHeader() {
  const { petMode, t } = usePreferences();
  const { count } = useCommerce();
  const icon = petMode === "cat" ? "🐱" : petMode === "dog" ? "🐶" : "🐱🐶";
  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main navigation">
        <NavLink className="logo" to="/home"><span className="logo-mark" aria-hidden="true" />pal2paw</NavLink>
        <div className="nav-links">
          <NavLink to="/home">{t("home")}</NavLink>
          <NavLink to="/products">{t("products")}</NavLink>
        </div>
        <div className="nav-actions">
          <NavLink className="pet-mode-control" to="/" aria-label={t("changeMode")}><span>{icon}</span></NavLink>
          <PreferenceControls />
          <CustomerNavigation />
          <NavLink className="round-link" to="/cart" aria-label={t("cart")}>🛒<span className="cart-badge" aria-label={t("cartCount", { count })}>{count}</span></NavLink>
        </div>
      </nav>
    </header>
  );
}
