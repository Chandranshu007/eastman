import { Minus, Plus } from "lucide-react";

export default function QuantitySelector({ quantity, onChange, max = Infinity, label = "Quantity" }) {
  return (
    <div className="quantity-control" aria-label={label}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
