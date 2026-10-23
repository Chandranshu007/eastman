# Eastman Store Backend

This backend powers the Eastman Store e-commerce application using Node.js, Express, and PostgreSQL.

It exposes the product catalog, product detail lookup, and coupon validation endpoints used by the React storefront.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- pg (PostgreSQL client)
- dotenv
- CORS

## Project Structure

- `server.js` — Express app and API routes
- `db.js` — PostgreSQL connection pool
- `package.json` — backend dependencies and scripts

## Prerequisites

Before running the backend, make sure you have:

- Node.js installed
- PostgreSQL running locally or in a configured environment
- A PostgreSQL database created for the app
- A `.env` file configured for the backend

## Environment Setup

Create a `.env` file inside the `backend/` folder:

```env
PORT=5050
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eastman
DB_USER=postgres
DB_PASSWORD=your_password
```

Important:
- Do not commit this file to version control.
- Keep database credentials only in the backend environment.
- The frontend should only use a public API base URL like `http://localhost:5050`.

## Install Dependencies

From the project root:

```bash
cd backend
npm install
```

## Run the Backend

Development mode:

```bash
npm run dev
```

Production/start mode:

```bash
npm start
```

The server runs by default on:

```text
http://localhost:5050
```

## API Endpoints

### Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "service": "eastman-ecommerce-api"
}
```

### Get All Products

```http
GET /api/products
```

Returns all active products ordered by ID.

Example response:

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "1",
      "name": "Wireless Headphones",
      "description": null,
      "price": "1999.00",
      "stock_quantity": 20,
      "category": "Electronics",
      "image_url": null,
      "is_active": true,
      "created_at": "2026-10-23T05:10:29.032Z"
    }
  ]
}
```

### Get Product by ID

```http
GET /api/products/:id
```

Returns a single active product by ID.

### Validate Coupon

```http
POST /api/coupons/validate
```

Request body:

```json
{
  "code": "SAVE10",
  "subtotal": 1500
}
```

Returns a success or validation error response for active and valid coupons.

## PostgreSQL Connection

The backend connects to PostgreSQL using the `pg` Pool in `db.js`.

Connection settings are loaded from environment variables with safe defaults:

- host: `localhost`
- port: `5432`
- database: `eastman`
- user: current OS user if unset

This application expects the database schema defined in:

- `database/schema.sql`

## Database Schema Notes

The backend queries the following tables:

- `public.products`
- `public.coupons`
- `public.orders`
- `public.order_items`

The product query uses the `stock` column aliased as `stock_quantity` so the frontend can consume the API consistently.

## Optional Virtual Environment Setup

If you also want to keep local project tooling isolated in a Python virtual environment, you can do:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

This is optional for the backend itself, since the service runs with Node.js and PostgreSQL, but it can be useful for local tooling and scripts.

## Notes

- Do not modify the database schema unless explicitly required.
- Do not hardcode database credentials into the codebase.
- Do not expose backend credentials through the frontend.
- The frontend should call the backend through a public API URL only.

## Troubleshooting

If the backend does not start:

1. Confirm PostgreSQL is running.
2. Verify `.env` values are correct.
3. Make sure the database exists and the user has access.
4. Check the port is not already in use.

If the frontend cannot load products:

1. Ensure the backend is running at `http://localhost:5050`.
2. Verify `GET /api/products` responds successfully.
3. Confirm the frontend is using `VITE_API_BASE_URL` correctly.

## License

This project is for the Eastman Store hackathon implementation.
