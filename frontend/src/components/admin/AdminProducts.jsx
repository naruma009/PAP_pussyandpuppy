import { useCallback, useEffect, useRef, useState } from "react";
import { createProduct, deleteProduct, updateProduct } from "../../services/api";
import { useAdmin } from "../../features/admin/AdminProvider";
import { useCatalog } from "../../features/catalog/CatalogProvider";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { CatalogError, CatalogLoading } from "../catalog/CatalogStates";
import AdminProductTable from "./AdminProductTable";
import ProductAdminForm from "./ProductAdminForm";

export default function AdminProducts() {
  const { products: catalogProducts, status: catalogStatus, error: catalogError, retry } = useCatalog();
  const { expireAdminSession } = useAdmin();
  const { t } = usePreferences();
  const [products, setProducts] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncWarning, setSyncWarning] = useState("");
  const [reconciling, setReconciling] = useState(false);
  const [sawRefreshLoading, setSawRefreshLoading] = useState(false);
  const controllerRef = useRef(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const mutationGenerationRef = useRef(0);
  const localSnapshotRef = useRef(false);
  const reconcilingRef = useRef(false);
  const pendingReconcileRef = useRef(false);

  const reconcile = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconcilingRef.current) { pendingReconcileRef.current = true; return; }
    reconcilingRef.current = true; setReconciling(true); setSawRefreshLoading(false); retry();
  }, [retry]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false; mutationGenerationRef.current += 1;
      pendingReconcileRef.current = false; controllerRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (catalogStatus === "success" && !reconciling && !localSnapshotRef.current) {
      setProducts(catalogProducts); setInitialized(true);
      if (editingProduct && !catalogProducts.some((product) => product.id === editingProduct.id)) setEditingProduct(null);
    }
  }, [catalogProducts, catalogStatus, editingProduct, reconciling]);
  useEffect(() => {
    if (!reconciling) return;
    if (catalogStatus === "loading") { setSawRefreshLoading(true); return; }
    if (catalogStatus === "error") {
      setSyncWarning(catalogError?.message || t("catalogSyncFailed"));
      reconcilingRef.current = false; setReconciling(false); setSawRefreshLoading(false);
      if (pendingReconcileRef.current) { pendingReconcileRef.current = false; queueMicrotask(reconcile); }
      return;
    }
    if (!sawRefreshLoading) return;
    if (catalogStatus === "success") {
      setSyncWarning(""); reconcilingRef.current = false; setReconciling(false); setSawRefreshLoading(false);
      if (pendingReconcileRef.current) { pendingReconcileRef.current = false; queueMicrotask(reconcile); }
    }
  }, [catalogError, catalogStatus, reconcile, reconciling, sawRefreshLoading, t]);

  const handleFailure = useCallback((nextError, onNotFound) => {
    if (nextError.name === "AbortError") return;
    if (nextError.status === 401) { expireAdminSession(); return; }
    setError(nextError.message);
    if (nextError.status === 404) { onNotFound?.(); retry(); }
  }, [expireAdminSession, retry]);
  const mutate = useCallback(async (operation, request, apply, onNotFound) => {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(""); setSuccess("");
    const controller = new AbortController(); controllerRef.current = controller;
    const generation = ++mutationGenerationRef.current;
    try {
      const result = await request(controller.signal);
      if (!mountedRef.current || controller.signal.aborted || generation !== mutationGenerationRef.current) return false;
      localSnapshotRef.current = true;
      apply(result); setSuccess(t(operation)); reconcile();
      return true;
    } catch (nextError) {
      if (mountedRef.current && generation === mutationGenerationRef.current) handleFailure(nextError, onNotFound);
      return false;
    } finally {
      if (mountedRef.current && generation === mutationGenerationRef.current) {
        if (controllerRef.current === controller) controllerRef.current = null;
        busyRef.current = false; setBusy(false);
      }
    }
  }, [handleFailure, reconcile, t]);
  const submit = (formData) => editingProduct
    ? mutate("productUpdated", (signal) => updateProduct(editingProduct.id, formData, signal), (product) => { setProducts((current) => current.map((item) => item.id === product.id ? product : item)); setEditingProduct(null); }, () => { setProducts((current) => current.filter((item) => item.id !== editingProduct.id)); setEditingProduct(null); })
    : mutate("productAdded", (signal) => createProduct(formData, signal), (product) => setProducts((current) => [...current, product]));
  const edit = (product) => {
    if (busyRef.current) return;
    setEditingProduct(product); setError(""); setSuccess("");
    requestAnimationFrame(() => document.querySelector(".admin-form")?.scrollIntoView?.({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth", block: "start" }));
  };
  const remove = (product) => {
    if (busyRef.current || !window.confirm(t("confirmDeleteProduct", { name: product.name }))) return;
    mutate("productDeleted", (signal) => deleteProduct(product.id, signal), () => { setProducts((current) => current.filter((item) => item.id !== product.id)); if (editingProduct?.id === product.id) setEditingProduct(null); }, () => { setProducts((current) => current.filter((item) => item.id !== product.id)); if (editingProduct?.id === product.id) setEditingProduct(null); });
  };
  const retrySync = () => { setSyncWarning(""); reconcile(); };

  if (!initialized && catalogStatus === "loading") return <section className="admin-products-state container"><CatalogLoading /></section>;
  if (!initialized && catalogStatus === "error") return <section className="admin-products-state container"><CatalogError onRetry={retry} /></section>;
  return <section className="admin-products container"><div className="section-heading"><div><span className="eyebrow">pal2paw Admin</span><h1>{t("manageProducts")}</h1><p>{t("manageProductsIntro")}</p></div></div>{success && <p className="admin-success" role="status">{success}</p>}{syncWarning && <div className="admin-sync-warning" role="alert"><span>{t("catalogSyncFailed")}: {syncWarning}</span><button type="button" onClick={retrySync}>{t("retry")}</button></div>}<ProductAdminForm editingProduct={editingProduct} busy={busy} error={error} onCancel={() => { setEditingProduct(null); setError(""); }} onSubmit={submit} /><AdminProductTable products={products} busy={busy} onEdit={edit} onDelete={remove} /></section>;
}
