import ProductCard from "./ProductCard";
export default function ProductGrid({ products }) { return <div id="product-grid" className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>; }
