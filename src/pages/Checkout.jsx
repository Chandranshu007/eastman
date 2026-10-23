import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

const DELIVERY_CHARGE = 50;

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const readCouponDiscount = () => {
  const rawCouponDiscount = Number(sessionStorage.getItem("eastman-coupon-discount") || "0");
  return Number.isFinite(rawCouponDiscount) && rawCouponDiscount > 0 ? rawCouponDiscount : 0;
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { detailedItems, originalSubtotal, productDiscountTotal, subtotal } = useCart();
  const [address, setAddress] = useState(() => sessionStorage.getItem("eastman-checkout-address") || "");
  const [phone, setPhone] = useState(() => sessionStorage.getItem("eastman-checkout-phone") || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?redirect=${encodeURIComponent("/checkout")}`, { replace: true });
    }
  }, [authLoading, navigate, user]);

  if (authLoading || !user) {
    return (
      <main className="checkout-page">
        <div className="checkout-shell empty-checkout-shell">
          <div className="checkout-empty-icon"><CheckCircle2 size={30} aria-hidden="true" /></div>
          <span className="eyebrow">CHECKING ACCOUNT</span>
          <h1>Please wait...</h1>
          <p>We are verifying your account before checkout.</p>
        </div>
      </main>
    );
  }

  useEffect(() => {
    sessionStorage.setItem("eastman-checkout-address", address);
  }, [address]);

  useEffect(() => {
    sessionStorage.setItem("eastman-checkout-phone", phone);
  }, [phone]);

  const cartIsEmpty = detailedItems.length === 0;
  const subtotalAfterDiscounts = useMemo(() => Math.max(originalSubtotal - productDiscountTotal, 0), [originalSubtotal, productDiscountTotal]);
  const deliveryCharge = cartIsEmpty ? 0 : DELIVERY_CHARGE;
  const couponDiscount = readCouponDiscount();
  const finalTotal = Math.max(subtotalAfterDiscounts + deliveryCharge - couponDiscount, 0);

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanedAddress = address.trim();
    const cleanedPhone = phone.trim();

    if (cartIsEmpty) {
      setError("Your cart is empty. Add an item before continuing.");
      return;
    }

    if (cleanedAddress.length < 10) {
      setError("Please enter a complete delivery address.");
      return;
    }

    if (!/^\+?[0-9\s()-]{10,}$/.test(cleanedPhone)) {
      setError("Please enter a valid phone number so we can contact you.");
      return;
    }

    sessionStorage.setItem("eastman-checkout-address", cleanedAddress);
    sessionStorage.setItem("eastman-checkout-phone", cleanedPhone);
    sessionStorage.setItem("eastman-checkout-breakdown", JSON.stringify({
      originalSubtotal,
      productDiscountTotal,
      subtotalAfterDiscounts,
      deliveryCharge,
      couponDiscount,
      finalTotal,
    }));
    setError("");
    navigate("/payment");
  };

  if (cartIsEmpty) {
    return (
      <main className="checkout-page">
        <div className="checkout-shell empty-checkout-shell">
          <div className="checkout-empty-icon"><CheckCircle2 size={30} aria-hidden="true" /></div>
          <span className="eyebrow">CART IS EMPTY</span>
          <h1>Your cart is waiting for you.</h1>
          <p>Add products to continue with checkout.</p>
          <Link className="button button-primary" to="/">Browse products</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-header">
        <div>
          <span className="eyebrow">SECURE CHECKOUT</span>
          <h1>Delivery details</h1>
        </div>
        <Link className="back-link" to="/cart"><ArrowLeft size={16} aria-hidden="true" /> Back to cart</Link>
      </div>

      <div className="checkout-layout">
        <section className="checkout-card" aria-label="Checkout form">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-field">
              <label htmlFor="address">Delivery address</label>
              <textarea
                id="address"
                rows="4"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="House number, street name, city, state, PIN code"
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. +91 98765 43210"
              />
            </div>

            {error ? <p className="checkout-error">{error}</p> : null}

            <button className="button button-primary checkout-submit" type="submit">
              Continue to payment <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
        </section>

        <aside className="checkout-summary" aria-label="Order summary">
          <h2>Order summary</h2>

          {detailedItems.map((item) => (
            <div key={item.id} className="checkout-summary-item">
              <div>
                <strong>{item.name}</strong>
                <span>Qty {item.quantity}</span>
              </div>
              <span>{formatPrice(item.lineSubtotal)}</span>
            </div>
          ))}

          <div className="checkout-summary-line">
            <span>Original subtotal</span>
            <strong>{formatPrice(originalSubtotal)}</strong>
          </div>
          <div className="checkout-summary-line discount-row">
            <span>Product discounts</span>
            <strong>-{formatPrice(productDiscountTotal)}</strong>
          </div>
          <div className="checkout-summary-line">
            <span>Subtotal after discounts</span>
            <strong>{formatPrice(subtotalAfterDiscounts)}</strong>
          </div>
          <div className="checkout-summary-line">
            <span>Delivery</span>
            <strong>{formatPrice(deliveryCharge)}</strong>
          </div>
          <div className="checkout-summary-line discount-row">
            <span>Coupon discount</span>
            <strong>-{formatPrice(couponDiscount)}</strong>
          </div>
          <div className="checkout-summary-total">
            <span>Final payable amount</span>
            <strong>{formatPrice(finalTotal)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}
