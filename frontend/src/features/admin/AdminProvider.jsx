import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getAdminSession, loginAdmin, logoutAdmin } from "../../services/api";

const AdminContext = createContext(null);

export default function AdminProvider({ children, bootstrap = true }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [status, setStatus] = useState(bootstrap ? "loading" : "ready");
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const bootstrapController = useRef(null);
  const mutationController = useRef(null);

  const invalidate = useCallback(() => {
    version.current += 1;
    bootstrapController.current?.abort();
    bootstrapController.current = null;
    return version.current;
  }, []);

  useEffect(() => {
    if (!bootstrap) return undefined;
    const requestVersion = invalidate();
    const controller = new AbortController();
    bootstrapController.current = controller;
    setStatus("loading"); setError(null);
    getAdminSession(controller.signal).then((result) => {
      if (requestVersion !== version.current) return;
      setAuthenticated(result.authenticated === true); setStatus("ready");
    }).catch((nextError) => {
      if (nextError.name === "AbortError" || requestVersion !== version.current) return;
      setError(nextError); setStatus("error");
    });
    return () => controller.abort();
  }, [bootstrap, invalidate, retry]);

  useEffect(() => () => { mutationController.current?.abort(); }, []);

  const beginMutation = useCallback(() => {
    const requestVersion = invalidate();
    mutationController.current?.abort();
    const controller = new AbortController();
    mutationController.current = controller;
    setError(null);
    return { controller, requestVersion };
  }, [invalidate]);

  const value = useMemo(() => ({
    authenticated, status, error,
    retry() { setRetry((current) => current + 1); },
    async login(code) {
      const { controller, requestVersion } = beginMutation();
      try {
        const result = await loginAdmin(code, controller.signal);
        if (requestVersion !== version.current) return false;
        setAuthenticated(true); setStatus("ready");
        return result.authenticated === true;
      } catch (nextError) {
        if (nextError.name === "AbortError" || requestVersion !== version.current) return false;
        setAuthenticated(false); setStatus("ready");
        throw nextError;
      } finally { if (mutationController.current === controller) mutationController.current = null; }
    },
    async logout() {
      const { controller, requestVersion } = beginMutation();
      try {
        await logoutAdmin(controller.signal);
        if (requestVersion !== version.current) return false;
        setAuthenticated(false); setStatus("ready");
        return true;
      } catch (nextError) {
        if (nextError.name === "AbortError" || requestVersion !== version.current) return false;
        setStatus("ready");
        throw nextError;
      } finally { if (mutationController.current === controller) mutationController.current = null; }
    },
  }), [authenticated, status, error, beginMutation]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside AdminProvider");
  return value;
}
