import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const readCheckoutBreakdown = () => {
  try {
    const savedBreakdown = sessionStorage.getItem("eastman-checkout-breakdown");
    if (!savedBreakdown) return null;
    return JSON.parse(savedBreakdown);
  } catch (error) {
    return null;
  }
};

export default function Payment() {
  const navigate = useNavigate();
  const { detailedItems, originalSubtotal, productDiscountTotal } = useCart();
  const [method, setMethod] = useState("UPI");
  const [error, setError] = useState("");

  const address = sessionStorage.getItem("eastman-checkout-address") || "";
  const phone = sessionStorage.getItem("eastman-checkout-phone") || "";

  const breakdown = useMemo(() => {
    const savedBreakdown = readCheckoutBreakdown();
    const calculatedSubtotalAfterDiscounts = Math.max(originalSubtotal - productDiscountTotal, 0);
    const calculatedDeliveryCharge = detailedItems.length > 0 ? 50 : 0;
    const calculatedCouponDiscount = Number(sessionStorage.getItem("eastman-coupon-discount") || "0") || 0;
    const calculatedFinalTotal = Math.max(calculatedSubtotalAfterDiscounts + calculatedDeliveryCharge - calculatedCouponDiscount, 0);

    if (!savedBreakdown) {
      return {
        originalSubtotal,
        productDiscountTotal,
        subtotalAfterDiscounts: calculatedSubtotalAfterDiscounts,
        deliveryCharge: calculatedDeliveryCharge,
        couponDiscount: calculatedCouponDiscount,
        finalTotal: calculatedFinalTotal,
      };
    }

    return {
      originalSubtotal: Number(savedBreakdown.originalSubtotal ?? originalSubtotal),
      productDiscountTotal: Number(savedBreakdown.productDiscountTotal ?? productDiscountTotal),
      subtotalAfterDiscounts: Number(savedBreakdown.subtotalAfterDiscounts ?? calculatedSubtotalAfterDiscounts),
      deliveryCharge: Number(savedBreakdown.deliveryCharge ?? calculatedDeliveryCharge),
      couponDiscount: Number(savedBreakdown.couponDiscount ?? calculatedCouponDiscount),
      finalTotal: Number(savedBreakdown.finalTotal ?? calculatedFinalTotal),
    };
  }, [detailedItems.length, originalSubtotal, productDiscountTotal]);

  useEffect(() => {
    if (detailedItems.length === 0 || !address.trim() || !/^\+?[0-9\s()-]{10,}$/.test(phone.trim())) {
      setError("Please complete the delivery details before continuing to payment.");
      return;
    }

    setError("");
  }, [address, detailedItems.length, phone]);

  const handlePlaceOrder = () => {
    if (detailedItems.length === 0) {
      setError("Your cart is empty. Add items before placing the demo order.");
      return;
    }

    if (!address.trim() || !/^\+?[0-9\s()-]{10,}$/.test(phone.trim())) {
      setError("Please complete delivery details before placing the order.");
      return;
    }

    setError("");
    sessionStorage.setItem("eastman-demo-payment-method", method);
    sessionStorage.setItem("eastman-demo-order-submitted", "true");
    sessionStorage.setItem("eastman-checkout-breakdown", JSON.stringify(breakdown));
    navigate("/order-confirmation");
  };

  return (
    <main className="checkout-page">
      <div className="checkout-header">
        <div>
          <span className="eyebrow">PAYMENT</span>
          <h1>Choose a payment method</h1>
        </div>
        <button type="button" className="back-link back-link-button" onClick={() => navigate("/checkout")}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to checkout
        </button>
      </div>

      <div className="checkout-layout payment-layout">
        <section className="checkout-card payment-card" aria-label="Payment options">
          <div className="payment-total">
            <span>Amount to pay</span>
            <strong>{formatPrice(breakdown.finalTotal)}</strong>
          </div>

          <div className="payment-options" role="radiogroup" aria-label="Payment methods">
            {[
              "UPI",
              "Credit / Debit Card",
              "Cash on Delivery",
            ].map((option) => (
              <label className="payment-option" key={option}>
                <input
                  type="radio"
                  name="payment-method"
                  value={option}
                  checked={method === option}
                  onChange={(event) => setMethod(event.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          {error ? <p className="checkout-error">{error}</p> : null}

          <p className="checkout-note">
            Demo checkout only. No real payment gateway is connected and no payment is processed.
          </p>

          <button type="button" className="button button-primary checkout-submit" onClick={handlePlaceOrder}>
            Place order <ArrowRight size={17} aria-hidden="true" />
          </button>
        </section>

        <aside className="checkout-summary" aria-label="Payment summary">
          <h2>Order summary</h2>
          <div className="checkout-summary-line">
            <span>Original subtotal</span>
            <strong>{formatPrice(breakdown.originalSubtotal)}</strong>
          </div>
          <div className="checkout-summary-line discount-row">
            <span>Product discounts</span>
            <strong>-{formatPrice(breakdown.productDiscountTotal)}</strong>
          </div>
          <div className="checkout-summary-line">
            <span>Subtotal after discounts</span>
            <strong>{formatPrice(breakdown.subtotalAfterDiscounts)}</strong>
          </div>
          <div className="checkout-summary-line">
            <span>Delivery</span>
            <strong>{formatPrice(breakdown.deliveryCharge)}</strong>
          </div>
          <div className="checkout-summary-line discount-row">
            <span>Coupon discount</span>
            <strong>-{formatPrice(breakdown.couponDiscount)}</strong>
          </div>
          <div className="checkout-summary-total">
            <span>Final payable amount</span>
            <strong>{formatPrice(breakdown.finalTotal)}</strong>
          </div>
          <div className="checkout-delivery-box">
            <span>Delivery to</span>
            <strong>{address || "Address not provided"}</strong>
            <small>{phone || "Phone not provided"}</small>
          </div>
        </aside>
      </div>
    </main>
  );
}
