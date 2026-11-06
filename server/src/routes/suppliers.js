const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const where = [];
  const params = [];
  if (q) {
    where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM suppliers ${whereSql} ORDER BY name`, params);
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Supplier not found' });

  const [[purchaseTotals]] = await pool.query(
    `SELECT COALESCE(SUM(total),0) AS purchased, COALESCE(SUM(paid_amount),0) AS paid FROM purchases WHERE supplier_id = ? AND status != 'cancelled'`,
    [req.params.id]
  );
  const supplier = rows[0];
  const balance = Number(supplier.opening_balance) + Number(purchaseTotals.purchased) - Number(purchaseTotals.paid);
  res.json({ ...supplier, balance });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, phone, email, address, trn, opening_balance } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const [result] = await pool.query(
    `INSERT INTO suppliers (name, phone, email, address, trn, opening_balance) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, phone || null, email || null, address || null, trn || null, opening_balance || 0]
  );
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { name, phone, email, address, trn, opening_balance } = req.body;
  await pool.query(
    `UPDATE suppliers SET name=?, phone=?, email=?, address=?, trn=?, opening_balance=? WHERE id=?`,
    [name, phone || null, email || null, address || null, trn || null, opening_balance || 0, req.params.id]
  );
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
