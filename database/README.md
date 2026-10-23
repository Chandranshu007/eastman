
# Eastman Hackathon — Database

## Requirements
- PostgreSQL
- pgAdmin 4 (optional)

## Database
Name: `eastman_cart`

## Setup
1. Create a PostgreSQL database named `eastman_cart`.
2. Execute `schema.sql` in pgAdmin Query Tool.
3. Execute `seed.sql` to insert sample products and coupons.
4. Verify the data in `products` and `coupons`.

Run the scripts on a fresh database only. Do not run
`seed.sql` repeatedly, as it may create duplicate records.

## Tables
- `products`: Product catalogue and stock
- `coupons`: Discount codes and validation rules
- `orders`: Checkout orders
- `order_items`: Products within each order
