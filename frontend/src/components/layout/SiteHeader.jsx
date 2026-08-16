import { NavLink } from "react-router-dom";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import PreferenceControls from "./PreferenceControls";

export default function SiteHeader() {
  const { petMode, t } = usePreferences();
  const icon = petMode === "cat" ? "🐱" : petMode === "dog" ? "🐶" : "🐱🐶";
  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main navigation">
        <NavLink className="logo" to="/home"><span className="logo-mark">P</span>PAP</NavLink>
        <div className="nav-links">
          <NavLink to="/home">{t("home")}</NavLink>
          <NavLink to="/products">{t("products")}</NavLink>
        </div>
        <div className="nav-actions">
          <NavLink className="pet-mode-control" to="/" aria-label={t("changeMode")}><span>{icon}</span></NavLink>
          <PreferenceControls />
          <NavLink className="round-link" to="/login" aria-label={t("login")}>☺</NavLink>
          <NavLink className="round-link" to="/cart" aria-label={t("cart")}>🛒<span className="cart-badge">0</span></NavLink>
        </div>
      </nav>
    </header>
  );
}
