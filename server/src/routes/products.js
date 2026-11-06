const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { q, lowStock, page = 1, pageSize = 50 } = req.query;
  const where = [];
  const params = [];

  if (q) {
    where.push('(code LIKE ? OR description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (lowStock === 'true') {
    where.push('qty_on_hand <= reorder_level');
  }
  where.push('is_active = 1');

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.min(parseInt(pageSize, 10) || 50, 200);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM products ${whereSql} ORDER BY description LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM products ${whereSql}`, params);

  res.json({ items: rows, total: countRows[0].total, page: Number(page), pageSize: limit });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json(rows[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { code, description, unit, category, cost_price, sale_price, reorder_level, qty_on_hand } = req.body;
  if (!code || !description) return res.status(400).json({ error: 'code and description are required' });

  const [result] = await pool.query(
    `INSERT INTO products (code, description, unit, category, cost_price, sale_price, reorder_level, qty_on_hand)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, description, unit || 'EA', category || null, cost_price || 0, sale_price || 0, reorder_level || 0, qty_on_hand || 0]
  );

  if (qty_on_hand && Number(qty_on_hand) !== 0) {
    await pool.query(
      `INSERT INTO stock_movements (product_id, type, qty, ref_table, note, created_by) VALUES (?, 'adjustment', ?, 'manual', 'Opening stock', ?)`,
      [result.insertId, qty_on_hand, req.user.id]
    );
  }

  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { code, description, unit, category, cost_price, sale_price, reorder_level, is_active } = req.body;
  await pool.query(
    `UPDATE products SET code = ?, description = ?, unit = ?, category = ?, cost_price = ?, sale_price = ?, reorder_level = ?, is_active = ?
     WHERE id = ?`,
    [code, description, unit, category || null, cost_price, sale_price, reorder_level, is_active === undefined ? 1 : is_active, req.params.id]
  );
  res.json({ ok: true });
}));

router.post('/:id/adjust', asyncHandler(async (req, res) => {
  const { qty, note } = req.body;
  if (qty === undefined || Number(qty) === 0) return res.status(400).json({ error: 'Non-zero qty is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO stock_movements (product_id, type, qty, ref_table, note, created_by) VALUES (?, 'adjustment', ?, 'manual', ?, ?)`,
      [req.params.id, qty, note || null, req.user.id]
    );
    await conn.query('UPDATE products SET qty_on_hand = qty_on_hand + ? WHERE id = ?', [qty, req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/:id/movements', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 200',
    [req.params.id]
  );
  res.json(rows);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
