import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  User, CreateUserDto, UpdateUserDto, PaginationQuery, PaginatedResult
} from '../models/types.js';

export const getUsers = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10')));
    const offset = (page - 1) * limit;

    const [dataRes, countRes] = await Promise.all([
      query('SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]),
      query('SELECT COUNT(*) FROM users'),
    ]);

    const total = parseInt(countRes.rows[0].count);
    const result: PaginatedResult<User> = {
      data: dataRes.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!rows.length) throw new AppError(404, `User ${req.params.id} not found`);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (
  req: Request<{}, {}, CreateUserDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, role = 'user' } = req.body;
    if (!name || !email) throw new AppError(400, 'name and email are required');

    const { rows } = await query(
      'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
      [name, email, role]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const { name, email, role } = req.body;
    if (name  !== undefined) { fields.push(`name  = $${idx++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (role  !== undefined) { fields.push(`role  = $${idx++}`); values.push(role); }

    if (!fields.length) throw new AppError(400, 'No fields to update');

    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!rows.length) throw new AppError(404, `User ${req.params.id} not found`);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (!rowCount) throw new AppError(404, `User ${req.params.id} not found`);
    res.json({ success: true, message: `User ${req.params.id} deleted` });
  } catch (err) {
    next(err);
  }
};
