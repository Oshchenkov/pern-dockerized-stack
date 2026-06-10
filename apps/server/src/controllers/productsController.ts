import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  Product, CreateProductDto, UpdateProductDto, PaginationQuery, PaginatedResult
} from '../models/types.js';

export const getProducts = async (
  req: Request<{}, {}, {}, PaginationQuery & { category?: string; minPrice?: string; maxPrice?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page     = Math.max(1, parseInt(req.query.page     || '1'));
    const limit    = Math.min(100, Math.max(1, parseInt(req.query.limit || '10')));
    const offset   = (page - 1) * limit;
    const category = req.query.category;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    const conditions: string[] = [];
    const params: unknown[]    = [];
    let idx = 1;

    if (category) { conditions.push(`category ILIKE $${idx++}`); params.push(`%${category}%`); }
    if (minPrice) { conditions.push(`price >= $${idx++}`); params.push(minPrice); }
    if (maxPrice) { conditions.push(`price <= $${idx++}`); params.push(maxPrice); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`SELECT * FROM products ${where} ORDER BY id LIMIT $${idx} OFFSET $${idx + 1}`,
            [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM products ${where}`, params),
    ]);

    const total = parseInt(countRes.rows[0].count);
    const result: PaginatedResult<Product> = {
      data: dataRes.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rows } = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows.length) throw new AppError(404, `Product ${req.params.id} not found`);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (
  req: Request<{}, {}, CreateProductDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, price, stock = 0, category } = req.body;
    if (!name || price === undefined) throw new AppError(400, 'name and price are required');
    if (price < 0) throw new AppError(400, 'price must be non-negative');

    const { rows } = await query(
      'INSERT INTO products (name, description, price, stock, category) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description ?? null, price, stock, category ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (
  req: Request<{ id: string }, {}, UpdateProductDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allowed: (keyof UpdateProductDto)[] = ['name', 'description', 'price', 'stock', 'category'];
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(req.body[key]);
      }
    }

    if (!fields.length) throw new AppError(400, 'No fields to update');

    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!rows.length) throw new AppError(404, `Product ${req.params.id} not found`);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rowCount } = await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) throw new AppError(404, `Product ${req.params.id} not found`);
    res.json({ success: true, message: `Product ${req.params.id} deleted` });
  } catch (err) {
    next(err);
  }
};
