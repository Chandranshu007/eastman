import { Check, X } from "lucide-react";

export default function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <span className="toast-check"><Check size={16} aria-hidden="true" /></span>
      <span>{message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onDismiss}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
