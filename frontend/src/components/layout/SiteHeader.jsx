import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import PreferenceControls from "./PreferenceControls";
import CustomerNavigation from "../commerce/CustomerNavigation";
import { useCommerce } from "../../features/commerce/CommerceProvider";
import AdminProvider from "../../features/admin/AdminProvider";
import AdminLoginDialog from "../admin/AdminLoginDialog";

export default function SiteHeader() {
  const { petMode, t } = usePreferences();
  const { count } = useCommerce();
  const location = useLocation();
  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const logoRef = useRef(null);
  const clickCount = useRef(0);
  const clickTimer = useRef(null);
  useEffect(() => () => clearTimeout(clickTimer.current), []);
  const closeAdminGate = useCallback(() => setAdminGateOpen(false), []);
  const countAdminClick = () => {
    if (location.pathname !== "/home") { clickCount.current = 0; return; }
    clickCount.current += 1;
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 1400);
    if (clickCount.current === 5) {
      clickCount.current = 0; clearTimeout(clickTimer.current); setAdminGateOpen(true);
    }
  };
  const icon = petMode === "cat" ? "🐱" : petMode === "dog" ? "🐶" : "🐱🐶";
  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main navigation">
        <NavLink ref={logoRef} className="logo" to="/home" onClick={countAdminClick}><span className="logo-mark">P</span>PAP</NavLink>
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
      {adminGateOpen && <AdminProvider bootstrap={false}><AdminLoginDialog onClose={closeAdminGate} returnFocusRef={logoRef} /></AdminProvider>}
    </header>
  );
}
