CREATE INDEX IF NOT EXISTS lbasy_products_updated ON products(updated_at DESC);
CREATE INDEX IF NOT EXISTS lbasy_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS lbasy_products_published ON products(published);
