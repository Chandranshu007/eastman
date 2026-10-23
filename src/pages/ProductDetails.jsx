import { ArrowLeft, CheckCircle2, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import QuantitySelector from "../components/QuantitySelector";
import { useCart } from "../context/CartContext";
import { fetchProductById, getOfferForProduct, getProductById } from "../data/products";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

export default function ProductDetails() {
  const { productId } = useParams();
  const { addToCart, applyProductOffer, removeProductOffer, selectedProductOffers } = useCart();
  const [product, setProduct] = useState(() => getProductById(productId));
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setIsLoading(true);
      setError("");

      try {
        const currentProduct = getProductById(productId);
        if (currentProduct) {
          setProduct(currentProduct);
        }

        const fetchedProduct = await fetchProductById(productId);
        if (!cancelled) {
          setProduct(fetchedProduct ?? currentProduct ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Unable to load this product.");
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    setQuantity(1);
    setOfferMessage("");
  }, [productId]);

  const offer = useMemo(() => getOfferForProduct(productId), [productId]);
  const selectedOffer = selectedProductOffers[String(productId)] ?? null;

  const handleOfferAction = async () => {
    if (!offer) return;

    try {
      await applyProductOffer(product.id, quantity);
      setOfferMessage("Offer applied successfully.");
    } catch (applyError) {
      setOfferMessage(applyError.message || "This offer is not eligible right now.");
    }
  };

  if (isLoading) {
    return (
      <main className="content-width not-found">
        <div className="not-found-mark">…</div>
        <span className="eyebrow">LOADING</span>
        <h1>Loading product...</h1>
        <p>Please wait while we fetch the latest product details.</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="content-width not-found">
        <div className="not-found-mark">?</div>
        <span className="eyebrow">WE COULDN'T FIND THAT ITEM</span>
        <h1>{error ? "Unable to load product" : "Product not found"}</h1>
        <p>{error || "It may have moved or is no longer part of our collection."}</p>
        <Link className="button button-primary" to="/">Back to home</Link>
      </main>
    );
  }

  const originalPrice = Number(product.originalPrice ?? product.price ?? 0);
  const hasDiscount = product.hasDiscount || (originalPrice > 0 && product.price < originalPrice);
  const discount = product.discountPercent ?? (originalPrice > 0 && product.price < originalPrice
    ? Math.round((1 - product.price / originalPrice) * 100)
    : 0);

  return (
    <main className="content-width detail-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden="true" /> Back to products</Link>
      <div className="detail-layout">
        <div className="detail-image-wrap">
          <ProductImage src={product.image} alt={product.name} className="detail-image" />
          <span className="detail-image-caption">A thoughtful pick from Eastman Store</span>
        </div>
        <section className="detail-info">
          <span className="eyebrow">{product.category.toUpperCase()}</span>
          <h1>{product.name}</h1>
          <div className="rating-row">
            <span className="rating-stars"><Star size={16} fill="currentColor" aria-hidden="true" /> {Number(product.rating ?? 4.5).toFixed(1)}</span>
            <span className="review-copy">Customer favorite</span>
          </div>
          <div className="detail-price-row">
            <strong>{formatPrice(product.price)}</strong>
            {hasDiscount ? <><del>{formatPrice(originalPrice)}</del><span className="discount-badge">{discount}% OFF</span></> : null}
          </div>
          <p className="detail-description">{product.description}</p>
          <div className={`detail-stock${product.stock === 0 ? " unavailable" : ""}`}>
            <CheckCircle2 size={17} aria-hidden="true" />
            {product.stock > 0 ? `${product.stock} available` : "Currently out of stock"}
          </div>
          {offer ? (
            <div className={`product-offer-box${selectedOffer ? " selected" : ""}`}>
              <div className="product-offer-header">
                <span className="product-offer-label">SPECIAL OFFER</span>
                <strong>{offer.shortLabel}</strong>
              </div>
              <p>{offer.description}</p>
              <small>Minimum purchase: {formatPrice(offer.minimumOrder)}</small>
              {selectedOffer ? (
                <button type="button" className="button button-outline button-small offer-action" onClick={() => removeProductOffer(product.id)}>
                  Offer Applied · Remove
                </button>
              ) : (
                <button type="button" className="button button-primary button-small offer-action" onClick={handleOfferAction}>
                  Apply Offer
                </button>
              )}
              {offerMessage ? <div className="offer-message">{offerMessage}</div> : null}
            </div>
          ) : null}
          <div className="detail-divider" />
          <div className="purchase-row">
            <div>
              <span className="field-label">Quantity</span>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={Math.max(product.stock, 1)}
              />
            </div>
            <button
              className="button button-primary detail-add"
              type="button"
              disabled={product.stock === 0}
              onClick={() => addToCart(product.id, quantity)}
            >
              <ShoppingBag size={17} aria-hidden="true" /> Add to cart
            </button>
          </div>
          <div className="delivery-card">
            <div><Truck size={19} aria-hidden="true" /><span><strong>Easy delivery</strong><small>Delivery options available at checkout</small></span></div>
            <div><ShieldCheck size={19} aria-hidden="true" /><span><strong>Shop with confidence</strong><small>Quality essentials, thoughtfully selected</small></span></div>
          </div>
          <Link className="subtle-link" to="/cart">View your cart</Link>
        </section>
      </div>
    </main>
  );
}
