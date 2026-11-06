const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function recalcInvoiceStatus(conn, invoiceId) {
  const [[inv]] = await conn.query('SELECT total, paid_amount FROM sales_invoices WHERE id = ?', [invoiceId]);
  if (!inv) return;
  let status = 'unpaid';
  if (Number(inv.paid_amount) >= Number(inv.total) && Number(inv.total) > 0) status = 'paid';
  else if (Number(inv.paid_amount) > 0) status = 'partial';
  await conn.query('UPDATE sales_invoices SET status = ? WHERE id = ?', [status, invoiceId]);
}

router.get('/payments', asyncHandler(async (req, res) => {
  const { party_type, party_id, from, to } = req.query;
  const where = [];
  const params = [];
  if (party_type) {
    where.push('party_type = ?');
    params.push(party_type);
  }
  if (party_id) {
    where.push('party_id = ?');
    params.push(party_id);
  }
  if (from) {
    where.push('payment_date >= ?');
    params.push(from);
  }
  if (to) {
    where.push('payment_date <= ?');
    params.push(to);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM payments ${whereSql} ORDER BY payment_date DESC, id DESC`, params);
  res.json(rows);
}));

router.post('/payments', asyncHandler(async (req, res) => {
  const { party_type, party_id, direction, amount, method, ref_type, ref_id, payment_date, notes } = req.body;
  if (!party_type || !party_id || !direction || !amount || !payment_date) {
    return res.status(400).json({ error: 'party_type, party_id, direction, amount, payment_date are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO payments (party_type, party_id, direction, amount, method, ref_type, ref_id, payment_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [party_type, party_id, direction, amount, method || 'cash', ref_type || null, ref_id || null, payment_date, notes || null, req.user.id]
    );

    if (ref_type === 'sales_invoice' && ref_id) {
      await conn.query('UPDATE sales_invoices SET paid_amount = paid_amount + ? WHERE id = ?', [amount, ref_id]);
      await recalcInvoiceStatus(conn, ref_id);
    } else if (ref_type === 'purchase' && ref_id) {
      await conn.query('UPDATE purchases SET paid_amount = paid_amount + ? WHERE id = ?', [amount, ref_id]);
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.delete('/payments/:id', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[payment]] = await conn.query('SELECT * FROM payments WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!payment) {
      await conn.rollback();
      return res.status(404).json({ error: 'Payment not found' });
    }
    if (payment.ref_type === 'sales_invoice' && payment.ref_id) {
      await conn.query('UPDATE sales_invoices SET paid_amount = paid_amount - ? WHERE id = ?', [payment.amount, payment.ref_id]);
      await recalcInvoiceStatus(conn, payment.ref_id);
    } else if (payment.ref_type === 'purchase' && payment.ref_id) {
      await conn.query('UPDATE purchases SET paid_amount = paid_amount - ? WHERE id = ?', [payment.amount, payment.ref_id]);
    }
    await conn.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/receivables', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.id, c.name, c.company, c.opening_balance,
      COALESCE(inv.invoiced,0) AS invoiced,
      COALESCE(inv.paid,0) AS paid,
      COALESCE(ret.returned,0) AS returned,
      (c.opening_balance + COALESCE(inv.invoiced,0) - COALESCE(inv.paid,0) - COALESCE(ret.returned,0)) AS balance
    FROM clients c
    LEFT JOIN (SELECT client_id, SUM(total) AS invoiced, SUM(paid_amount) AS paid FROM sales_invoices WHERE status != 'cancelled' GROUP BY client_id) inv ON inv.client_id = c.id
    LEFT JOIN (SELECT client_id, SUM(total) AS returned FROM sales_returns GROUP BY client_id) ret ON ret.client_id = c.id
    HAVING balance != 0
    ORDER BY balance DESC
  `);
  res.json(rows);
}));

router.get('/payables', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT s.id, s.name, s.opening_balance,
      COALESCE(p.purchased,0) AS purchased,
      COALESCE(p.paid,0) AS paid,
      (s.opening_balance + COALESCE(p.purchased,0) - COALESCE(p.paid,0)) AS balance
    FROM suppliers s
    LEFT JOIN (SELECT supplier_id, SUM(total) AS purchased, SUM(paid_amount) AS paid FROM purchases WHERE status != 'cancelled' GROUP BY supplier_id) p ON p.supplier_id = s.id
    HAVING balance != 0
    ORDER BY balance DESC
  `);
  res.json(rows);
}));

module.exports = router;
