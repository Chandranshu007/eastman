export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5050").replace(/\/$/, "");

const fallbackProductImage = "";

export const PRODUCT_OFFERS = {
  1: {
    code: "WIRELESS10",
    shortLabel: "SAVE10",
    title: "SPECIAL OFFER",
    description: "Get 10% OFF",
    minimumOrder: 1000,
    discountType: "percent",
    discountValue: 10,
  },
  2: {
    code: "WATCH200",
    shortLabel: "FLAT ₹200 OFF",
    title: "SPECIAL OFFER",
    description: "Flat ₹200 OFF",
    minimumOrder: 2000,
    discountType: "fixed",
    discountValue: 200,
  },
  3: {
    code: "SPEAKER15",
    shortLabel: "SAVE15",
    title: "SPECIAL OFFER",
    description: "Get 15% OFF",
    minimumOrder: 1000,
    discountType: "percent",
    discountValue: 15,
  },
  4: {
    code: "HUB100",
    shortLabel: "FLAT ₹100 OFF",
    title: "SPECIAL OFFER",
    description: "Flat ₹100 OFF",
    minimumOrder: 500,
    discountType: "fixed",
    discountValue: 100,
  },
  5: {
    code: "LAMP10",
    shortLabel: "SAVE10",
    title: "SPECIAL OFFER",
    description: "Get 10% OFF",
    minimumOrder: 500,
    discountType: "percent",
    discountValue: 10,
  },
  6: {
    code: "STAND12",
    shortLabel: "SAVE12",
    title: "SPECIAL OFFER",
    description: "Get 12% OFF",
    minimumOrder: 1000,
    discountType: "percent",
    discountValue: 12,
  },
};

export const getOfferForProduct = (productId) => {
  if (productId === undefined || productId === null || productId === "") return null;
  const key = String(productId);
  return PRODUCT_OFFERS[Number(key)] ?? PRODUCT_OFFERS[key] ?? null;
};

export const normalizeProduct = (product) => {
  const price = Number(product?.price ?? 0);
  const originalPrice = Number(product?.original_price ?? product?.originalPrice ?? product?.price ?? price);
  const safeOriginalPrice = Math.max(originalPrice, price);
  const discountAmount = Math.max(safeOriginalPrice - price, 0);
  const discountPercent = safeOriginalPrice > price && safeOriginalPrice > 0
    ? Math.round((discountAmount / safeOriginalPrice) * 100)
    : 0;
  const stock = Number(product?.stock ?? product?.stock_quantity ?? 0);
  const rating = Number(product?.rating ?? 4.5);

  return {
    ...product,
    id: product?.id,
    name: product?.name ?? "Unnamed Product",
    description: product?.description ?? "No description available.",
    category: product?.category ?? "General",
    price,
    originalPrice: safeOriginalPrice,
    discountAmount,
    discountPercent,
    hasDiscount: discountAmount > 0,
    image: product?.image || product?.image_url || fallbackProductImage,
    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
    rating: Number.isFinite(rating) ? rating : 4.5,
  };
};

export const products = [];

export async function fetchProducts() {
  const response = await fetch(`${API_BASE_URL}/api/products`);

  if (!response.ok) {
    throw new Error("Unable to load products from the server.");
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const normalizedProducts = rows.map(normalizeProduct);

  products.splice(0, products.length, ...normalizedProducts);
  return normalizedProducts;
}

export async function fetchProductById(productId) {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load this product.");
  }

  const payload = await response.json();
  const product = payload?.data ? normalizeProduct(payload.data) : null;

  if (product) {
    const index = products.findIndex((item) => String(item.id) === String(product.id));
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
  }

  return product;
}

export const getProductById = (productId) =>
  products.find((product) => String(product.id) === String(productId)) ?? null;
