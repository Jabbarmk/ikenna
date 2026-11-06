const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { nextNumber } = require('../utils/numbering');

const router = express.Router();
router.use(requireAuth);

function computeTotals(items, vatRate) {
  const subtotal = items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_cost), 0);
  const vat_amount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vat_amount) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, vat_amount, total };
}

router.get('/', asyncHandler(async (req, res) => {
  const { q, status, supplier_id } = req.query;
  const where = [];
  const params = [];
  if (q) {
    where.push('(p.purchase_no LIKE ? OR s.name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }
  if (supplier_id) {
    where.push('p.supplier_id = ?');
    params.push(supplier_id);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT p.*, s.name AS supplier_name FROM purchases p JOIN suppliers s ON s.id = p.supplier_id ${whereSql} ORDER BY p.created_at DESC`,
    params
  );
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, s.name AS supplier_name FROM purchases p JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Purchase not found' });
  const [items] = await pool.query(
    `SELECT pi.*, pr.code, pr.description AS product_description FROM purchase_items pi JOIN products pr ON pr.id = pi.product_id WHERE purchase_id = ?`,
    [req.params.id]
  );
  res.json({ ...rows[0], items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { supplier_id, purchase_date, notes, items, vat_rate, status } = req.body;
  if (!supplier_id || !purchase_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'supplier_id, purchase_date and at least one item are required' });
  }
  const vatRate = vat_rate !== undefined ? Number(vat_rate) : 5;
  const finalStatus = status === 'pending' ? 'pending' : 'received';
  const { subtotal, vat_amount, total } = computeTotals(items, vatRate);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const purchaseNo = await nextNumber(conn, 'PO');
    const [result] = await conn.query(
      `INSERT INTO purchases (purchase_no, supplier_id, purchase_date, status, subtotal, vat_amount, total, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [purchaseNo, supplier_id, purchase_date, finalStatus, subtotal, vat_amount, total, notes || null, req.user.id]
    );

    for (const it of items) {
      const lineTotal = Math.round(Number(it.qty) * Number(it.unit_cost) * 100) / 100;
      await conn.query(
        `INSERT INTO purchase_items (purchase_id, product_id, qty, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, it.product_id, it.qty, it.unit_cost, lineTotal]
      );
      if (finalStatus === 'received') {
        await conn.query(
          `INSERT INTO stock_movements (product_id, type, qty, ref_table, ref_id, created_by) VALUES (?, 'purchase', ?, 'purchases', ?, ?)`,
          [it.product_id, Math.abs(it.qty), result.insertId, req.user.id]
        );
        await conn.query(
          'UPDATE products SET qty_on_hand = qty_on_hand + ?, cost_price = ? WHERE id = ?',
          [it.qty, it.unit_cost, it.product_id]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, purchase_no: purchaseNo });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.post('/:id/receive', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [purchaseRows] = await conn.query('SELECT * FROM purchases WHERE id = ? FOR UPDATE', [req.params.id]);
    const purchase = purchaseRows[0];
    if (!purchase) {
      await conn.rollback();
      return res.status(404).json({ error: 'Purchase not found' });
    }
    if (purchase.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Only pending purchases can be received' });
    }
    const [items] = await conn.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
    for (const it of items) {
      await conn.query(
        `INSERT INTO stock_movements (product_id, type, qty, ref_table, ref_id, created_by) VALUES (?, 'purchase', ?, 'purchases', ?, ?)`,
        [it.product_id, Math.abs(it.qty), purchase.id, req.user.id]
      );
      await conn.query(
        'UPDATE products SET qty_on_hand = qty_on_hand + ?, cost_price = ? WHERE id = ?',
        [it.qty, it.unit_cost, it.product_id]
      );
    }
    await conn.query('UPDATE purchases SET status = "received" WHERE id = ?', [purchase.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [purchaseRows] = await conn.query('SELECT * FROM purchases WHERE id = ? FOR UPDATE', [req.params.id]);
    const purchase = purchaseRows[0];
    if (!purchase) {
      await conn.rollback();
      return res.status(404).json({ error: 'Purchase not found' });
    }
    if (purchase.status === 'cancelled') {
      await conn.rollback();
      return res.status(400).json({ error: 'Already cancelled' });
    }
    if (Number(purchase.paid_amount) > 0) {
      await conn.rollback();
      return res.status(400).json({
        error: `This purchase has AED ${purchase.paid_amount} in recorded payments. Delete or refund the payment(s) in Accounts before cancelling.`,
      });
    }
    if (purchase.status === 'received') {
      const [items] = await conn.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
      for (const it of items) {
        await conn.query(
          `INSERT INTO stock_movements (product_id, type, qty, ref_table, ref_id, note, created_by) VALUES (?, 'adjustment', ?, 'purchases', ?, 'Purchase cancelled', ?)`,
          [it.product_id, -Math.abs(it.qty), purchase.id, req.user.id]
        );
        await conn.query('UPDATE products SET qty_on_hand = qty_on_hand - ? WHERE id = ?', [it.qty, it.product_id]);
      }
    }
    await conn.query('UPDATE purchases SET status = "cancelled" WHERE id = ?', [purchase.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
