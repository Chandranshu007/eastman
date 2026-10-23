# Eastman Store

A responsive React storefront prototype for the Eastman hackathon. The catalog currently uses local mock data and the cart is persisted in the browser.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Run `npm run build` to create a production build.

## Features

- Product catalog with live search and category filters.
- Product detail pages at `/product/:productId`.
- Shared cart with stock-limited quantities and `localStorage` persistence.
- Responsive layouts, empty states, and a checkout integration placeholder.

## Backend integration contract

The frontend mock catalog is in `src/data/products.js`. A future `GET /api/products` response should be a JSON array using this product shape:

```json
{
  "id": "wireless-headphones",
  "name": "Wireless Headphones",
  "category": "Electronics",
  "price": 2499,
  "originalPrice": 3499,
  "description": "Product description",
  "image": "https://example.com/product.jpg",
  "stock": 12,
  "rating": 4.8
}
```

Use stable string IDs and prices in INR (whole rupees). The cart stores only `{ "id": "wireless-headphones", "quantity": 1 }` entries and resolves product details from the shared catalog. Checkout is intentionally a placeholder; no order is submitted or saved by this frontend.
