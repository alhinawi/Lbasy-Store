-- Catalog photos and design examples are not proof of physical stock.
ALTER TABLE products ADD COLUMN inventory_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(inventory_confirmed IN (0,1));
CREATE TRIGGER IF NOT EXISTS only_confirmed_inventory BEFORE INSERT ON order_items BEGIN
 SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM products WHERE id=NEW.product_id AND inventory_confirmed=1)
 THEN RAISE(ABORT,'inventory_not_confirmed') END;
END;
