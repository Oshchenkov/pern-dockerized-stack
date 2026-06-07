import { Request, Response, NextFunction } from 'express';
import { query, getClient } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { OrderWithItems, PaginationQuery, PaginatedResult } from '../models/types';

export const getOrders = async (
  req: Request<{}, {}, {}, PaginationQuery & { status?: string; user_id?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page   || '1'));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit || '10')));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[]    = [];
    let idx = 1;

    if (req.query.status)  { conditions.push(`o.status = $${idx++}`);  params.push(req.query.status); }
    if (req.query.user_id) { conditions.push(`o.user_id = $${idx++}`); params.push(req.query.user_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(
        `SELECT o.*, u.name AS user_name, u.email AS user_email
         FROM orders o
         JOIN users u ON u.id = o.user_id
         ${where}
         ORDER BY o.id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM orders o ${where}`, params),
    ]);

    const total = parseInt(countRes.rows[0].count);
    const result: PaginatedResult<unknown> = {
      data: dataRes.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [orderRes, itemsRes] = await Promise.all([
      query(
        `SELECT o.*, u.name AS user_name, u.email AS user_email
         FROM orders o JOIN users u ON u.id = o.user_id
         WHERE o.id = $1`,
        [req.params.id]
      ),
      query(
        `SELECT oi.*, p.name AS product_name
         FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [req.params.id]
      ),
    ]);

    if (!orderRes.rows.length) throw new AppError(404, `Order ${req.params.id} not found`);

    const order: OrderWithItems = { ...orderRes.rows[0], items: itemsRes.rows };
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (
  req: Request<{}, {}, { user_id: number; items: { product_id: number; quantity: number }[] }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const client = await getClient();
  try {
    const { user_id, items } = req.body;
    if (!user_id || !items?.length) throw new AppError(400, 'user_id and items[] are required');

    await client.query('BEGIN');

    // Verify user exists
    const userRes = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (!userRes.rows.length) throw new AppError(404, `User ${user_id} not found`);

    // Lock & validate products, compute total
    let total = 0;
    const enriched: { product_id: number; quantity: number; unit_price: number; name: string }[] = [];

    for (const item of items) {
      const { rows } = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );
      if (!rows.length) throw new AppError(404, `Product ${item.product_id} not found`);
      if (rows[0].stock < item.quantity) {
        throw new AppError(409, `Insufficient stock for "${rows[0].name}" (available: ${rows[0].stock})`);
      }
      total += rows[0].price * item.quantity;
      enriched.push({ product_id: item.product_id, quantity: item.quantity, unit_price: rows[0].price, name: rows[0].name });
    }

    // Create order
    const { rows: [order] } = await client.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
      [user_id, total]
    );

    // Insert items & decrement stock
    for (const item of enriched) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [order.id, item.product_id, item.quantity, item.unit_price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { ...order, items: enriched } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (
  req: Request<{ id: string }, {}, { status: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) {
      throw new AppError(400, `Invalid status. Must be one of: ${valid.join(', ')}`);
    }
    const { rows } = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows.length) throw new AppError(404, `Order ${req.params.id} not found`);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
