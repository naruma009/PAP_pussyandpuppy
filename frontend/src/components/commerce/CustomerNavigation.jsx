import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCommerce } from "../../features/commerce/CommerceProvider";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export default function CustomerNavigation() {
  const { customer, customerStatus, retrySession, logout } = useCommerce();
  const { language, t } = usePreferences();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); setOpen(false); trigger.current?.focus();
    };
    document.addEventListener("click", closeOutside); document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("click", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [open]);
  if (customerStatus === "loading") return <span className="customer-nav-loading" aria-label={t("checkingSession")} />;
  if (customerStatus === "error" && !customer) return <button className="round-link" type="button" aria-label={t("retrySession")} onClick={retrySession}>↻</button>;
  if (!customer) return <NavLink className="round-link" to="/login" aria-label={t("login")}>☺</NavLink>;
  const signOut = async () => {
    setLogoutError("");
    try { await logout(); setOpen(false); navigate("/home"); } catch (error) { setLogoutError(error.message); }
  };
  return <div className="customer-account" ref={root}><button ref={trigger} className="customer-trigger" type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>{language === "en" ? "Hi" : "สวัสดี"}, <span>{customer.name}</span> <span aria-hidden="true">⌄</span></button>{open && <div className="customer-menu" id={panelId}><div className="customer-summary"><strong>{customer.name}</strong><small>{customer.email}</small></div><button type="button" onClick={signOut}>{t("logout")}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>}</div>;
}
