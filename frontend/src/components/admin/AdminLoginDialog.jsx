import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../features/admin/AdminProvider";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export default function AdminLoginDialog({ onClose, returnFocusRef }) {
  const { login } = useAdmin();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    inputRef.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab") return;
      const dialog = inputRef.current?.closest('[role="dialog"]');
      const focusable = [...(dialog?.querySelectorAll("button:not(:disabled),input:not(:disabled)") || [])];
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); returnFocusRef?.current?.focus(); };
  }, [onClose, returnFocusRef]);
  useEffect(() => { if (error) { inputRef.current?.focus(); inputRef.current?.select(); } }, [error]);
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError("");
    try { if (await login(code)) { onClose(); navigate("/admin"); } }
    catch (nextError) { setError(nextError.message); }
    finally { setSubmitting(false); }
  };
  return <div className="admin-gate" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-gate-box" role="dialog" aria-modal="true" aria-labelledby="admin-login-title"><button type="button" className="gate-close" aria-label={t("closeAdminLogin")} onClick={onClose}>×</button><form onSubmit={submit}><h1 id="admin-login-title">{t("adminLogin")}</h1><label htmlFor="admin-code">{t("accessCode")}</label><input ref={inputRef} id="admin-code" type="password" autoComplete="off" required value={code} onChange={(event) => setCode(event.target.value)} /><button className="button" type="submit" disabled={submitting}>{t(submitting ? "checkingCode" : "continueAdmin")}</button><p className="status" role={error ? "alert" : undefined} aria-live="polite">{error}</p></form></section></div>;
}
