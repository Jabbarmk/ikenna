const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { nextNumber } = require('../utils/numbering');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const where = [];
  const params = [];
  if (q) {
    where.push('(r.return_no LIKE ? OR c.name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT r.*, c.name AS client_name, i.invoice_no FROM sales_returns r
     JOIN clients c ON c.id = r.client_id JOIN sales_invoices i ON i.id = r.invoice_id
     ${whereSql} ORDER BY r.created_at DESC`,
    params
  );
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, c.name AS client_name, c.company AS client_company, c.address AS client_address, c.trn AS client_trn, i.invoice_no
     FROM sales_returns r JOIN clients c ON c.id = r.client_id JOIN sales_invoices i ON i.id = r.invoice_id WHERE r.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Return not found' });
  const [items] = await pool.query('SELECT * FROM sales_return_items WHERE return_id = ?', [req.params.id]);
  res.json({ ...rows[0], items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { invoice_id, return_date, reason, items } = req.body;
  if (!invoice_id || !return_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'invoice_id, return_date and at least one item are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [invRows] = await conn.query('SELECT * FROM sales_invoices WHERE id = ? FOR UPDATE', [invoice_id]);
    const invoice = invRows[0];
    if (!invoice) {
      await conn.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const subtotal = items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_price), 0);
    const vat_amount = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + vat_amount) * 100) / 100;

    const returnNo = await nextNumber(conn, 'SR');
    const [result] = await conn.query(
      `INSERT INTO sales_returns (return_no, invoice_id, client_id, return_date, subtotal, vat_amount, total, reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [returnNo, invoice_id, invoice.client_id, return_date, Math.round(subtotal * 100) / 100, vat_amount, total, reason || null, req.user.id]
    );

    for (const it of items) {
      const lineTotal = Math.round(Number(it.qty) * Number(it.unit_price) * 100) / 100;
      await conn.query(
        `INSERT INTO sales_return_items (return_id, product_id, description, qty, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)`,
        [result.insertId, it.product_id || null, it.description, it.qty, it.unit_price, lineTotal]
      );
      if (it.product_id) {
        await conn.query(
          `INSERT INTO stock_movements (product_id, type, qty, ref_table, ref_id, created_by) VALUES (?, 'sale_return', ?, 'sales_returns', ?, ?)`,
          [it.product_id, Math.abs(it.qty), result.insertId, req.user.id]
        );
        await conn.query('UPDATE products SET qty_on_hand = qty_on_hand + ? WHERE id = ?', [it.qty, it.product_id]);
      }
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, return_no: returnNo });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
