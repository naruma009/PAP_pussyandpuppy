import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProducts } from "../../services/api";
import { readFavorites, writeFavorites } from "./favorites";

const CatalogContext = createContext(null);

export default function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);
    getProducts(controller.signal).then((result) => {
      setProducts(result);
      setFavorites(readFavorites(result));
      setStatus("success");
    }).catch((nextError) => {
      if (nextError.name !== "AbortError") {
        setError(nextError);
        setStatus("error");
      }
    });
    return () => controller.abort();
  }, [requestVersion]);

  const retry = useCallback(() => setRequestVersion((value) => value + 1), []);
  const toggleFavorite = useCallback((id) => {
    const numericId = Number(id);
    if (!products.some((product) => Number(product.id) === numericId)) return;
    setFavorites((current) => {
      const next = current.includes(numericId) ? current.filter((item) => item !== numericId) : [...current, numericId];
      writeFavorites(next);
      return next;
    });
  }, [products]);

  const value = useMemo(() => ({ products, status, error, retry, favorites, toggleFavorite }), [products, status, error, retry, favorites, toggleFavorite]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
