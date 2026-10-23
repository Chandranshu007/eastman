import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CheckoutPlaceholder() {
  return (
    <main className="content-width checkout-placeholder">
      <div className="checkout-icon"><CheckCircle2 size={30} aria-hidden="true" /></div>
      <span className="eyebrow">COMING NEXT</span>
      <h1>Checkout integration is on its way.</h1>
      <p>Your cart is still here. Checkout will be connected when the order service is ready.</p>
      <Link className="back-link" to="/cart"><ArrowLeft size={16} aria-hidden="true" /> Return to cart</Link>
    </main>
  );
}
