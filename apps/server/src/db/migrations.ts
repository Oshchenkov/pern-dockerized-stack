import { query } from './pool.js';

export const runMigrations = async (): Promise<void> => {
  console.log('🔧 Running migrations...');

  // Create tables
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      name      VARCHAR(100) NOT NULL,
      email     VARCHAR(150) UNIQUE NOT NULL,
      role      VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user','moderator')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(150) NOT NULL,
      description TEXT,
      price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      stock       INT          NOT NULL DEFAULT 0 CHECK (stock >= 0),
      category    VARCHAR(80),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id          SERIAL PRIMARY KEY,
      user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
      total       NUMERIC(10,2) NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id         SERIAL PRIMARY KEY,
      order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id),
      quantity   INT NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(10,2) NOT NULL
    )
  `);

  // Auto-update updated_at trigger
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
  `);

  for (const table of ['users', 'products', 'orders']) {
    await query(`
      DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table};
      CREATE TRIGGER trg_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
  }

  console.log('✅ Migrations complete');
};

export const seedData = async (): Promise<void> => {
  const { rows } = await query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) > 0) {
    console.log('⏭️  Seed data already present, skipping');
    return;
  }

  console.log('🌱 Seeding demo data...');

  // Users
  await query(`
    INSERT INTO users (name, email, role) VALUES
      ('Alice Johnson',   'alice@example.com',   'admin'),
      ('Bob Smith',       'bob@example.com',     'user'),
      ('Carol Williams',  'carol@example.com',   'user'),
      ('David Brown',     'david@example.com',   'moderator'),
      ('Eve Davis',       'eve@example.com',     'user')
  `);

  // Products
  await query(`
    INSERT INTO products (name, description, price, stock, category) VALUES
      ('Wireless Headphones', 'Noise-cancelling over-ear headphones',  89.99, 120, 'Electronics'),
      ('Mechanical Keyboard', 'RGB TKL keyboard with Cherry MX switches', 129.00, 45, 'Electronics'),
      ('Coffee Mug',          'Ceramic mug — keeps drinks hot 4 hrs',  14.99, 300, 'Kitchen'),
      ('Standing Desk Mat',   'Anti-fatigue mat for standing desks',   49.99,  80, 'Office'),
      ('USB-C Hub',           '7-in-1 hub with HDMI, USB 3.0, SD card', 39.99, 200, 'Electronics'),
      ('Notebook A5',         'Dotted hardcover notebook, 240 pages',  12.50, 500, 'Stationery'),
      ('Laptop Stand',        'Adjustable aluminium laptop riser',     34.99,  60, 'Office'),
      ('Blue Light Glasses',  'Glasses that filter blue light',        24.99, 150, 'Accessories')
  `);

  // Orders
  await query(`
    INSERT INTO orders (user_id, status, total) VALUES
      (1, 'delivered',   219.98),
      (2, 'shipped',      89.99),
      (3, 'processing',   62.49),
      (2, 'pending',      34.99),
      (4, 'delivered',   154.98)
  `);

  // Order items
  await query(`
    INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
      (1, 1, 1,  89.99),
      (1, 2, 1, 129.00),
      (2, 1, 1,  89.99),
      (3, 3, 2,  14.99),
      (3, 6, 1,  12.50),
      (3, 7, 1,  34.99),
      (4, 4, 1,  49.99),
      (5, 2, 1, 129.00),
      (5, 5, 1,  39.99),
      (5, 8, 1,  24.99)
  `);

  console.log('✅ Demo data seeded (5 users, 8 products, 5 orders)');
};
