import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "../catalog/CatalogProvider";
import { getCustomerSession, loginCustomer, logoutCustomer } from "../../services/api";
import { addCartItem, cartCount, cartTotal, changeCartQuantity, readCart, removeCartItem, writeCart } from "./cart";

const CommerceContext = createContext(null);

export default function CommerceProvider({ children }) {
  const { products, status: catalogStatus } = useCatalog();
  const inventoryKey = products.map((product) => `${product.id}:${product.stock}`).join("|");
  const [cart, setCart] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [customerStatus, setCustomerStatus] = useState("loading");
  const [sessionError, setSessionError] = useState(null);
  const [sessionRetry, setSessionRetry] = useState(0);
  const [notice, setNotice] = useState("");
  const sessionVersion = useRef(0);
  const sessionController = useRef(null);
  const authController = useRef(null);
  const noticeTimer = useRef(null);
  const sanitizedInventory = useRef();

  useEffect(() => {
    if (catalogStatus !== "success" || sanitizedInventory.current === inventoryKey) return;
    const sanitized = readCart(products);
    writeCart(sanitized);
    setCart(sanitized);
    sanitizedInventory.current = inventoryKey;
  }, [catalogStatus, inventoryKey]);

  useEffect(() => {
    const version = ++sessionVersion.current;
    const controller = new AbortController();
    sessionController.current?.abort();
    sessionController.current = controller;
    setCustomerStatus("loading");
    setSessionError(null);
    getCustomerSession(controller.signal).then((result) => {
      if (version !== sessionVersion.current) return;
      setCustomer(result.customer);
      setCustomerStatus("ready");
    }).catch((error) => {
      if (error.name === "AbortError" || version !== sessionVersion.current) return;
      setSessionError(error);
      setCustomerStatus("error");
    });
    return () => controller.abort();
  }, [sessionRetry]);

  useEffect(() => () => {
    authController.current?.abort();
    clearTimeout(noticeTimer.current);
  }, []);

  const save = useCallback((next) => { writeCart(next); setCart(next); }, []);
  const announce = useCallback((message) => {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 1800);
  }, []);
  const invalidateSession = useCallback(() => {
    const version = ++sessionVersion.current;
    sessionController.current?.abort();
    sessionController.current = null;
    return version;
  }, []);
  const beginAuthMutation = useCallback(() => {
    const version = invalidateSession();
    authController.current?.abort();
    const controller = new AbortController();
    authController.current = controller;
    return { controller, version };
  }, [invalidateSession]);

  const value = useMemo(() => ({
    cart: cart || [], cartReady: cart !== null, count: cartCount(cart || []), total: cartTotal(cart || [], products),
    customer, customerStatus, sessionError, notice, announce,
    retrySession() { setSessionRetry((value) => value + 1); },
    addToCart(id, amount = 1) {
      if (cart === null) return false;
      const result = addCartItem(cart, products, Number(id), amount);
      if (result.added) save(result.cart);
      return result.added;
    },
    changeQuantity(id, change) {
      if (cart === null) return { changed: false, limited: false };
      const result = changeCartQuantity(cart, products, Number(id), change);
      if (result.changed) save(result.cart);
      return result;
    },
    removeFromCart(id) { if (cart !== null) save(removeCartItem(cart, Number(id))); },
    async login(credentials) {
      const { controller, version } = beginAuthMutation();
      setCustomerStatus("loading"); setSessionError(null);
      try {
        const result = await loginCustomer(credentials, controller.signal);
        if (version !== sessionVersion.current) return null;
        setCustomer(result.customer); setCustomerStatus("ready");
        return result.customer;
      } catch (error) {
        if (error.name === "AbortError" || version !== sessionVersion.current) return null;
        if (version === sessionVersion.current) { setSessionError(error); setCustomerStatus("error"); }
        throw error;
      } finally {
        if (authController.current === controller) authController.current = null;
      }
    },
    async logout() {
      const { controller, version } = beginAuthMutation();
      setCustomerStatus("loading"); setSessionError(null);
      try {
        await logoutCustomer(controller.signal);
        if (version !== sessionVersion.current) return false;
        setCustomer(null); setCustomerStatus("ready");
        return true;
      } catch (error) {
        if (error.name === "AbortError" || version !== sessionVersion.current) return false;
        if (version === sessionVersion.current) { setSessionError(error); setCustomerStatus("error"); }
        throw error;
      } finally {
        if (authController.current === controller) authController.current = null;
      }
    },
  }), [cart, products, customer, customerStatus, sessionError, notice, announce, beginAuthMutation, save]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const value = useContext(CommerceContext);
  if (!value) throw new Error("useCommerce must be used inside CommerceProvider");
  return value;
}
