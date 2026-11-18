PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
 password_hash TEXT, google_id TEXT UNIQUE, avatar TEXT, role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, price INTEGER NOT NULL CHECK(price>=0),
 stock INTEGER NOT NULL CHECK(stock>=0 AND stock<=1), published INTEGER NOT NULL DEFAULT 1,
 data TEXT NOT NULL CHECK(json_valid(data)), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS drops (slug TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));
CREATE TABLE IF NOT EXISTS shipping (code TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));
CREATE TABLE IF NOT EXISTS saved_items (
 user_id TEXT NOT NULL REFERENCES users(id), product_id TEXT NOT NULL REFERENCES products(id),
 kind TEXT NOT NULL CHECK(kind IN ('cart','favorites')), PRIMARY KEY(user_id,product_id,kind)
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','confirmed','shipped','delivered','cancelled')),
 data TEXT NOT NULL CHECK(json_valid(data)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 idempotency_key TEXT NOT NULL, UNIQUE(user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, created_at);
CREATE TABLE IF NOT EXISTS order_items (
 order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES products(id),
 price INTEGER NOT NULL, PRIMARY KEY(order_id,product_id)
);
CREATE TRIGGER IF NOT EXISTS reserve_one_piece BEFORE INSERT ON order_items BEGIN
 SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM products WHERE id=NEW.product_id AND stock=1 AND published=1 AND price=NEW.price)
 THEN RAISE(ABORT,'sold_or_price_changed') END;
 UPDATE products SET stock=0,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=NEW.product_id;
END;
