import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'demo_api',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('  [DB]', { query: text.slice(0, 80), duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

export const getClient = (): Promise<PoolClient> => pool.connect();

export const testConnection = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
  } finally {
    client.release();
  }
};

export default pool;
