import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export default function ProductImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  const safeSrc = typeof src === "string" && src.trim() ? src : "";

  if (!safeSrc || failed) {
    return (
      <div className={`image-placeholder ${className}`} role="img" aria-label={alt}>
        <ImageIcon size={34} strokeWidth={1.4} aria-hidden="true" />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={safeSrc}
      alt={alt}
      loading="lazy"
      style={{ objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
}
