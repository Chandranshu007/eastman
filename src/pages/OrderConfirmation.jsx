import { useEffect, useMemo } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
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

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const { detailedItems, originalSubtotal, productDiscountTotal, subtotal, clearCart } = useCart();

  const address = sessionStorage.getItem("eastman-checkout-address") || "Address not provided";
  const paymentMethod = sessionStorage.getItem("eastman-demo-payment-method") || "Not selected";

  const breakdown = useMemo(() => {
    const savedBreakdown = readCheckoutBreakdown();
    const computedSubtotalAfterDiscounts = Math.max(originalSubtotal - productDiscountTotal, 0);
    const computedDelivery = detailedItems.length > 0 ? 50 : 0;
    const computedCoupon = Number(sessionStorage.getItem("eastman-coupon-discount") || "0") || 0;
    const computedFinalTotal = Math.max(computedSubtotalAfterDiscounts + computedDelivery - computedCoupon, 0);

    if (!savedBreakdown) {
      return {
        originalSubtotal,
        productDiscountTotal,
        subtotalAfterDiscounts: computedSubtotalAfterDiscounts,
        deliveryCharge: computedDelivery,
        couponDiscount: computedCoupon,
        finalTotal: computedFinalTotal,
      };
    }

    return {
      originalSubtotal: Number(savedBreakdown.originalSubtotal ?? originalSubtotal),
      productDiscountTotal: Number(savedBreakdown.productDiscountTotal ?? productDiscountTotal),
      subtotalAfterDiscounts: Number(savedBreakdown.subtotalAfterDiscounts ?? computedSubtotalAfterDiscounts),
      deliveryCharge: Number(savedBreakdown.deliveryCharge ?? computedDelivery),
      couponDiscount: Number(savedBreakdown.couponDiscount ?? computedCoupon),
      finalTotal: Number(savedBreakdown.finalTotal ?? computedFinalTotal),
    };
  }, [detailedItems.length, originalSubtotal, productDiscountTotal, subtotal]);

  const orderId = useMemo(() => {
    const savedOrderId = sessionStorage.getItem("eastman-demo-order-id");
    if (savedOrderId) return savedOrderId;

    const generatedOrderId = `ORD-${Date.now().toString().slice(-8)}`;
    sessionStorage.setItem("eastman-demo-order-id", generatedOrderId);
    return generatedOrderId;
  }, []);

  useEffect(() => {
    const shouldClearCart = sessionStorage.getItem("eastman-demo-order-submitted") === "true";
    if (!shouldClearCart) return;

    clearCart();
    sessionStorage.removeItem("eastman-demo-order-submitted");
  }, [clearCart]);

  return (
    <main className="checkout-page confirmation-page">
      <div className="confirmation-header">
        <div className="confirmation-badge"><CheckCircle2 size={28} aria-hidden="true" /></div>
        <span className="eyebrow">DEMO ORDER</span>
        <h1>Order confirmed</h1>
        <p>This is a demo checkout. No real payment or delivery has been processed.</p>
      </div>

      <section className="checkout-card confirmation-card">
        <div className="confirmation-summary">
          <div>
            <span>Order reference</span>
            <strong>{orderId}</strong>
          </div>
          <div>
            <span>Payment method</span>
            <strong>{paymentMethod}</strong>
          </div>
        </div>

        <div className="confirmation-items">
          <h2>Items</h2>
          {detailedItems.length === 0 ? (
            <p className="confirmation-empty">Your cart is empty.</p>
          ) : (
            detailedItems.map((item) => (
              <div key={item.id} className="confirmation-item">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <strong>{formatPrice(item.lineSubtotal)}</strong>
              </div>
            ))
          )}
        </div>

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
          <span>Delivery charge</span>
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

        <div className="confirmation-address">
          <span>Delivery address</span>
          <strong>{address}</strong>
        </div>

        <button type="button" className="button button-primary checkout-submit" onClick={() => navigate("/")}>
          <ShoppingBag size={17} aria-hidden="true" /> Continue shopping
        </button>
      </section>
    </main>
  );
}
