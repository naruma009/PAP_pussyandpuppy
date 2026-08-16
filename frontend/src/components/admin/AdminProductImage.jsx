import { useEffect, useState } from "react";

export default function AdminProductImage({ product, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.id, product.image]);
  return product.image && !failed
    ? <img className={className} src={product.image} alt={product.name} onError={() => setFailed(true)} />
    : <span className="admin-emoji" aria-hidden="true">{product.emoji || "🐾"}</span>;
}
