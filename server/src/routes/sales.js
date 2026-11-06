const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { nextNumber } = require('../utils/numbering');

const router = express.Router();
router.use(requireAuth);

function computeTotals(items, vatRate) {
  const subtotal = items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_price), 0);
  const vat_amount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vat_amount) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, vat_amount, total };
}

router.get('/', asyncHandler(async (req, res) => {
  const { q, status, client_id, from, to } = req.query;
  const where = [];
  const params = [];
  if (q) {
    where.push('(i.invoice_no LIKE ? OR c.name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('i.status = ?');
    params.push(status);
  }
  if (client_id) {
    where.push('i.client_id = ?');
    params.push(client_id);
  }
  if (from) {
    where.push('i.invoice_date >= ?');
    params.push(from);
  }
  if (to) {
    where.push('i.invoice_date <= ?');
    params.push(to);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT i.*, c.name AS client_name FROM sales_invoices i JOIN clients c ON c.id = i.client_id ${whereSql} ORDER BY i.created_at DESC`,
    params
  );
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT i.*, c.name AS client_name, c.company AS client_company, c.address AS client_address, c.phone AS client_phone, c.trn AS client_trn
     FROM sales_invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
  const [items] = await pool.query('SELECT * FROM sales_invoice_items WHERE invoice_id = ?', [req.params.id]);
  res.json({ ...rows[0], items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { client_id, invoice_date, notes, items, vat_rate, allow_negative_stock } = req.body;
  if (!client_id || !invoice_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'client_id, invoice_date and at least one item are required' });
  }
  const vatRate = vat_rate !== undefined ? Number(vat_rate) : 5;
  const { subtotal, vat_amount, total } = computeTotals(items, vatRate);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (!allow_negative_stock) {
      for (const it of items) {
        if (!it.product_id) continue;
        const [[product]] = await conn.query('SELECT qty_on_hand, description FROM products WHERE id = ? FOR UPDATE', [it.product_id]);
        if (product && Number(product.qty_on_hand) < Number(it.qty)) {
          await conn.rollback();
          return res.status(400).json({ error: `Insufficient stock for "${product.description}" (available: ${product.qty_on_hand})` });
        }
      }
    }

    const invoiceNo = await nextNumber(conn, 'INV');
    const [result] = await conn.query(
      `INSERT INTO sales_invoices (invoice_no, client_id, invoice_date, subtotal, vat_amount, total, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'unpaid', ?, ?)`,
      [invoiceNo, client_id, invoice_date, subtotal, vat_amount, total, notes || null, req.user.id]
    );

    for (const it of items) {
      const lineTotal = Math.round(Number(it.qty) * Number(it.unit_price) * 100) / 100;
      await conn.query(
        `INSERT INTO sales_invoice_items (invoice_id, product_id, description, qty, unit_price, vat_rate, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [result.insertId, it.product_id || null, it.description, it.qty, it.unit_price, vatRate, lineTotal]
      );
      if (it.product_id) {
        await conn.query(
          `INSERT INTO stock_movements (product_id, type, qty, ref_table, ref_id, created_by) VALUES (?, 'sale', ?, 'sales_invoices', ?, ?)`,
          [it.product_id, -Math.abs(it.qty), result.insertId, req.user.id]
        );
        await conn.query('UPDATE products SET qty_on_hand = qty_on_hand - ? WHERE id = ?', [it.qty, it.product_id]);
      }
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, invoice_no: invoiceNo });
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
    const [invRows] = await conn.query('SELECT * FROM sales_invoices WHERE id = ? FOR UPDATE', [req.params.id]);
    const invoice = invRows[0];
    if (!invoice) {
      await conn.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.status === 'cancelled') {
      await conn.rollback();
      return res.status(400).json({ error: 'Already cancelled' });
    }
    if (Number(invoice.paid_amount) > 0) {
      await conn.rollback();
      return res.status(400).json({
        error: `This invoice has AED ${invoice.paid_amount} in recorded payments. Delete or refund the payment(s) in Accounts before cancelling.`,
      });
    }
    const [items] = await conn.query('SELECT * FROM sales_invoice_items WHERE invoice_id = ?', [req.params.id]);
    for (const it of items) {
      if (!it.product_id) continue;
      await conn.query(
        `INSERT INTO stock_movements (product_id, type, qty, ref_table, ref_id, note, created_by) VALUES (?, 'adjustment', ?, 'sales_invoices', ?, 'Invoice cancelled', ?)`,
        [it.product_id, Math.abs(it.qty), invoice.id, req.user.id]
      );
      await conn.query('UPDATE products SET qty_on_hand = qty_on_hand + ? WHERE id = ?', [it.qty, it.product_id]);
    }
    await conn.query('UPDATE sales_invoices SET status = "cancelled" WHERE id = ?', [invoice.id]);
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
