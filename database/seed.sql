
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price numeric(12,2);

INSERT INTO products (name, category, price, original_price, stock, image_url)
SELECT *
FROM (
    VALUES
        ('Wireless Headphones', 'Electronics', 1999.00, 2499.00, 20, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80'),
        ('Smart Watch', 'Electronics', 2499.00, 3299.00, 15, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'),
        ('Bluetooth Speaker', 'Electronics', 1499.00, 1999.00, 12, 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=1200&q=80'),
        ('USB-C Hub', 'Accessories', 899.00, 1199.00, 25, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=80'),
        ('Laptop Stand', 'Accessories', 799.00, 999.00, 18, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'),
        ('Desk Lamp', 'Home', 599.00, 799.00, 30, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80'),
        ('Wireless Mouse', 'Accessories', 699.00, 999.00, 22, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80'),
        ('Mechanical Keyboard', 'Electronics', 2999.00, 3999.00, 10, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1200&q=80'),
        ('Water Bottle', 'Home', 399.00, 599.00, 40, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80'),
        ('Laptop Backpack', 'Accessories', 1299.00, 1599.00, 14, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80')
) AS v(name, category, price, original_price, stock, image_url)
WHERE NOT EXISTS (
    SELECT 1
    FROM products p
    WHERE p.name = v.name
);

UPDATE products
SET
    original_price = CASE name
        WHEN 'Wireless Headphones' THEN 2499.00
        WHEN 'Smart Watch' THEN 3299.00
        WHEN 'Bluetooth Speaker' THEN 1999.00
        WHEN 'USB-C Hub' THEN 1199.00
        WHEN 'Laptop Stand' THEN 999.00
        WHEN 'Desk Lamp' THEN 799.00
        WHEN 'Wireless Mouse' THEN 999.00
        WHEN 'Mechanical Keyboard' THEN 3999.00
        WHEN 'Water Bottle' THEN 599.00
        WHEN 'Laptop Backpack' THEN 1599.00
        ELSE original_price
    END,
    image_url = CASE name
        WHEN 'Wireless Headphones' THEN 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Smart Watch' THEN 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Bluetooth Speaker' THEN 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=1200&q=80'
        WHEN 'USB-C Hub' THEN 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Laptop Stand' THEN 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Desk Lamp' THEN 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Wireless Mouse' THEN 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Mechanical Keyboard' THEN 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Water Bottle' THEN 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80'
        WHEN 'Laptop Backpack' THEN 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80'
        ELSE image_url
    END
WHERE name IN (
    'Wireless Headphones',
    'Smart Watch',
    'Bluetooth Speaker',
    'USB-C Hub',
    'Laptop Stand',
    'Desk Lamp',
    'Wireless Mouse',
    'Mechanical Keyboard',
    'Water Bottle',
    'Laptop Backpack'
);

UPDATE products
SET original_price = price
WHERE original_price IS NULL;

INSERT INTO coupons
    (code, discount_type, discount_value, min_order_amount, max_discount)
VALUES
('SAVE10', 'percent', 10, 500, 500),
('FLAT100', 'fixed', 100, 1000, NULL),
('WIRELESS10', 'percent', 10, 1000, NULL),
('WATCH200', 'fixed', 200, 2000, NULL),
('SPEAKER15', 'percent', 15, 1000, NULL),
('HUB100', 'fixed', 100, 500, NULL),
('LAMP10', 'percent', 10, 500, NULL),
('STAND12', 'percent', 12, 1000, NULL)
ON CONFLICT (code) DO UPDATE
SET discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    min_order_amount = EXCLUDED.min_order_amount,
    max_discount = EXCLUDED.max_discount,
    is_active = TRUE;
