import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getOfferForProduct } from "../data/products";
import ProductImage from "./ProductImage";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

export default function ProductCard({ product }) {
  const { addToCart, selectedProductOffers } = useCart();
  const originalPrice = Number(product.originalPrice ?? product.price ?? 0);
  const hasDiscount = product.hasDiscount || (originalPrice > 0 && product.price < originalPrice);
  const discount = product.discountPercent ?? (originalPrice > 0 && product.price < originalPrice
    ? Math.round((1 - product.price / originalPrice) * 100)
    : 0);
  const offer = getOfferForProduct(product.id);
  const selectedOffer = selectedProductOffers[String(product.id)] ?? null;

  return (
    <article className="product-card">
      <Link className="product-image-link" to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
        <ProductImage src={product.image} alt={product.name} className="product-image" />
        {hasDiscount ? <span className="discount-badge">{discount}% OFF</span> : null}
      </Link>
      <div className="product-card-content">
        <span className="product-category">{product.category}</span>
        <Link className="product-name" to={`/product/${product.id}`}>{product.name}</Link>
        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {hasDiscount ? <span className="original-price">{formatPrice(originalPrice)}</span> : null}
        </div>
        {offer ? (
          <div className={`product-offer-chip${selectedOffer ? " selected" : ""}`}>
            {selectedOffer ? "Offer applied" : offer.shortLabel}
          </div>
        ) : null}
        <div className={`stock-note${product.stock === 0 ? " unavailable" : ""}`}>
          {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
        </div>
        <div className="product-card-actions">
          <Link className="button button-outline button-small" to={`/product/${product.id}`}>
            Details <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button
            className="button button-primary button-small"
            type="button"
            disabled={product.stock === 0}
            onClick={() => addToCart(product.id)}
          >
            <ShoppingBag size={15} aria-hidden="true" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
