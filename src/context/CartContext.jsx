import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, getOfferForProduct, products } from "../data/products";

const CartContext = createContext(null);
const PRODUCT_OFFERS_STORAGE_KEY = "eastman-product-offers";

const getProductMap = () => new Map(products.map((product) => [String(product.id), product]));

const getPricingDetails = (product, quantity) => {
  const sellingPrice = Number(product?.price ?? 0);
  const originalPrice = Number(product?.originalPrice ?? product?.price ?? sellingPrice);
  const normalizedOriginalPrice = Math.max(originalPrice, sellingPrice);
  const unitDiscount = Math.max(normalizedOriginalPrice - sellingPrice, 0);
  const discountPercent = normalizedOriginalPrice > sellingPrice && normalizedOriginalPrice > 0
    ? Math.round((unitDiscount / normalizedOriginalPrice) * 100)
    : 0;

  return {
    sellingPrice,
    originalPrice: normalizedOriginalPrice,
    unitDiscount,
    discountPercent,
    lineOriginalTotal: normalizedOriginalPrice * quantity,
    lineDiscountTotal: unitDiscount * quantity,
    lineSubtotal: sellingPrice * quantity,
    hasDiscount: unitDiscount > 0,
  };
};

function readStoredCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem("eastman-cart") || "[]");
    if (!Array.isArray(storedCart)) return [];

    const productMap = getProductMap();

    return storedCart.flatMap((item) => {
      const product = productMap.get(String(item?.id));
      const quantity = Number(item?.quantity);
      if (!product || !Number.isInteger(quantity) || quantity <= 0) return [];

      const safeQuantity = Math.min(quantity, product.stock);
      return safeQuantity > 0 ? [{ id: product.id, quantity: safeQuantity }] : [];
    });
  } catch (error) {
    console.error("Unable to restore the saved cart.", error);
    return [];
  }
}

function readStoredOffers() {
  try {
    const stored = JSON.parse(localStorage.getItem(PRODUCT_OFFERS_STORAGE_KEY) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch (error) {
    console.error("Unable to restore stored offers.", error);
    return {};
  }
}

function calculateOfferDiscountForSubtotal(offer, subtotal) {
  if (!offer || !Number.isFinite(subtotal)) return 0;
  if (subtotal < Number(offer.minimumOrder ?? 0)) return 0;

  if (offer.discountType === "percent") {
    return Math.min((subtotal * Number(offer.discountValue || 0)) / 100, subtotal);
  }

  if (offer.discountType === "fixed") {
    return Math.min(Number(offer.discountValue || 0), subtotal);
  }

  return 0;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readStoredCart);
  const [selectedProductOffers, setSelectedProductOffers] = useState(readStoredOffers);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("eastman-cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Unable to save the cart.", error);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCT_OFFERS_STORAGE_KEY, JSON.stringify(selectedProductOffers));
    } catch (error) {
      console.error("Unable to save product offers.", error);
    }
  }, [selectedProductOffers]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const validateOffer = async (offerCode, subtotal) => {
    const normalizedSubtotal = Number(subtotal ?? 0);
    const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: offerCode, subtotal: normalizedSubtotal }),
    });

    const payload = await response.json().catch(() => ({ success: false, message: "Unable to validate offer." }));

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "This offer is not available right now.");
    }

    return {
      discountAmount: Number(payload?.data?.discount_amount ?? 0),
      finalAmount: Number(payload?.data?.final_amount ?? 0),
      couponCode: payload?.data?.coupon_code ?? offerCode,
    };
  };

  const applyProductOffer = async (productId, quantity = 1) => {
    const normalizedProductId = String(productId);
    const product = getProductMap().get(normalizedProductId);
    const offer = getOfferForProduct(productId);

    if (!product || !offer) {
      throw new Error("This product does not have an available offer.");
    }

    const cartSubtotal = cartItems.reduce((total, item) => {
      const cartProduct = getProductMap().get(String(item.id));
      if (!cartProduct) return total;
      return total + (cartProduct.price * item.quantity);
    }, 0);
    const existingQuantity = cartItems.find((item) => String(item.id) === normalizedProductId)?.quantity ?? 0;
    const currentProductLine = (Number(product.price ?? 0) * Number(quantity || 1));
    const subtotalForValidation = Math.max(cartSubtotal - (Number(product.price ?? 0) * existingQuantity), 0) + currentProductLine;

    if (subtotalForValidation < Number(offer.minimumOrder)) {
      throw new Error(`This offer requires a minimum purchase of ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(offer.minimumOrder)}.`);
    }

    const validation = await validateOffer(offer.code, subtotalForValidation);

    setSelectedProductOffers((currentOffers) => ({
      ...currentOffers,
      [normalizedProductId]: {
        ...offer,
        code: validation.couponCode,
        discountAmount: Number(validation.discountAmount ?? 0),
        finalAmount: Number(validation.finalAmount ?? 0),
        minimumOrder: Number(offer.minimumOrder ?? 0),
      },
    }));

    setToastMessage(`Offer applied: ${offer.shortLabel}`);
    return validation;
  };

  const removeProductOffer = (productId) => {
    const normalizedProductId = String(productId);
    setSelectedProductOffers((currentOffers) => {
      const nextOffers = { ...currentOffers };
      delete nextOffers[normalizedProductId];
      return nextOffers;
    });
    setToastMessage("Offer removed");
  };

  const addToCart = (productId, quantity = 1) => {
    const normalizedProductId = String(productId);
    const product = getProductMap().get(normalizedProductId);
    const requestedQuantity = Number(quantity);

    if (!product || product.stock < 1 || !Number.isInteger(requestedQuantity) || requestedQuantity < 1) return false;

    const safeQuantity = Math.min(requestedQuantity, product.stock);

    setCartItems((currentItems) => {
      const existing = currentItems.find((item) => String(item.id) === normalizedProductId);
      const currentQuantity = existing?.quantity ?? 0;
      const nextQuantity = Math.min(currentQuantity + safeQuantity, product.stock);
      return existing
        ? currentItems.map((item) =>
            String(item.id) === normalizedProductId ? { ...item, quantity: nextQuantity } : item,
          )
        : [...currentItems, { id: product.id, quantity: safeQuantity }];
    });
    setToastMessage("Added to cart");
    return true;
  };

  const removeFromCart = (productId) => {
    const normalizedProductId = String(productId);
    setCartItems((currentItems) => currentItems.filter((item) => String(item.id) !== normalizedProductId));
    setSelectedProductOffers((currentOffers) => {
      const nextOffers = { ...currentOffers };
      delete nextOffers[normalizedProductId];
      return nextOffers;
    });
  };

  const updateQuantity = (productId, quantity) => {
    const normalizedProductId = String(productId);
    const product = getProductMap().get(normalizedProductId);
    if (!product) return;

    const nextQuantity = Number(quantity);
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const clampedQuantity = Math.min(Math.floor(nextQuantity), product.stock);
    setCartItems((currentItems) => {
      const updatedItems = currentItems.map((item) =>
        String(item.id) === normalizedProductId ? { ...item, quantity: clampedQuantity } : item,
      ).filter((item) => item.quantity > 0);

      const subtotal = updatedItems.reduce((total, entry) => {
        const productData = getProductMap().get(String(entry.id));
        if (!productData) return total;
        return total + Number(productData.price) * Number(entry.quantity);
      }, 0);

      const activeOffer = selectedProductOffers[String(productId)];
      if (activeOffer) {
        if (subtotal < Number(activeOffer.minimumOrder ?? 0)) {
          setSelectedProductOffers((currentOffers) => {
            const nextOffers = { ...currentOffers };
            delete nextOffers[normalizedProductId];
            return nextOffers;
          });
          setToastMessage(`Offer removed: minimum purchase is ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(activeOffer.minimumOrder)}.`);
        } else {
          validateOffer(activeOffer.code, subtotal)
            .then((validation) => {
              setSelectedProductOffers((currentOffers) => ({
                ...currentOffers,
                [normalizedProductId]: {
                  ...activeOffer,
                  code: validation.couponCode,
                  discountAmount: Number(validation.discountAmount ?? 0),
                  finalAmount: Number(validation.finalAmount ?? 0),
                  minimumOrder: Number(activeOffer.minimumOrder ?? 0),
                },
              }));
            })
            .catch(() => {
              setSelectedProductOffers((currentOffers) => {
                const nextOffers = { ...currentOffers };
                delete nextOffers[normalizedProductId];
                return nextOffers;
              });
              setToastMessage("Offer removed because it is no longer eligible.");
            });
        }
      }

      return updatedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedProductOffers({});
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const detailedItems = cartItems.flatMap((item) => {
    const product = getProductMap().get(String(item.id));
    if (!product) return [];

    const pricing = getPricingDetails(product, item.quantity);
    const offer = selectedProductOffers[String(item.id)] ?? null;
    const offerDiscountAmount = offer ? Math.min(Number(offer.discountAmount ?? 0), Number(pricing.lineSubtotal)) : 0;

    return [{
      ...product,
      quantity: item.quantity,
      sellingPrice: pricing.sellingPrice,
      originalPrice: pricing.originalPrice,
      unitDiscount: pricing.unitDiscount,
      discountPercent: pricing.discountPercent,
      hasDiscount: pricing.hasDiscount,
      lineOriginalTotal: pricing.lineOriginalTotal,
      lineDiscountTotal: pricing.lineDiscountTotal,
      lineSubtotal: pricing.lineSubtotal,
      selectedOffer: offer,
      offerDiscountAmount,
      lineSubtotalAfterOffer: Math.max(pricing.lineSubtotal - offerDiscountAmount, 0),
    }];
  });

  const originalSubtotal = detailedItems.reduce((total, item) => total + item.originalPrice * item.quantity, 0);
  const baseProductDiscountTotal = detailedItems.reduce((total, item) => total + (item.lineDiscountTotal ?? 0), 0);
  const selectedOfferDiscountTotal = detailedItems.reduce((total, item) => total + (Number(item.offerDiscountAmount ?? 0)), 0);
  const productDiscountTotal = baseProductDiscountTotal + selectedOfferDiscountTotal;
  const subtotal = detailedItems.reduce((total, item) => total + item.sellingPrice * item.quantity, 0);
  const subtotalAfterProductDiscounts = Math.max(subtotal - selectedOfferDiscountTotal, 0);

  const value = useMemo(
    () => ({
      cartItems,
      detailedItems,
      itemCount,
      subtotal,
      subtotalAfterProductDiscounts,
      originalSubtotal,
      productDiscountTotal,
      finalProductSubtotal: subtotalAfterProductDiscounts,
      selectedProductOffers,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      applyProductOffer,
      removeProductOffer,
      toastMessage,
      dismissToast: () => setToastMessage(""),
    }),
    [cartItems, detailedItems, itemCount, subtotal, subtotalAfterProductDiscounts, originalSubtotal, productDiscountTotal, selectedProductOffers, toastMessage],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider.");
  return context;
}
