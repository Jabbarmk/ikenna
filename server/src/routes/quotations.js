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
  const { q, status, client_id } = req.query;
  const where = [];
  const params = [];
  if (q) {
    where.push('(q.quote_no LIKE ? OR c.name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('q.status = ?');
    params.push(status);
  }
  if (client_id) {
    where.push('q.client_id = ?');
    params.push(client_id);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT q.*, c.name AS client_name FROM quotations q JOIN clients c ON c.id = q.client_id ${whereSql} ORDER BY q.created_at DESC`,
    params
  );
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT q.*, c.name AS client_name, c.company AS client_company, c.address AS client_address, c.phone AS client_phone, c.trn AS client_trn
     FROM quotations q JOIN clients c ON c.id = q.client_id WHERE q.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Quotation not found' });
  const [items] = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = ?', [req.params.id]);
  res.json({ ...rows[0], items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { client_id, quote_date, valid_until, notes, items, vat_rate } = req.body;
  if (!client_id || !quote_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'client_id, quote_date and at least one item are required' });
  }
  const vatRate = vat_rate !== undefined ? Number(vat_rate) : 5;
  const { subtotal, vat_amount, total } = computeTotals(items, vatRate);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const quoteNo = await nextNumber(conn, 'QTN');
    const [result] = await conn.query(
      `INSERT INTO quotations (quote_no, client_id, status, quote_date, valid_until, subtotal, vat_amount, total, notes, created_by)
       VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)`,
      [quoteNo, client_id, quote_date, valid_until || null, subtotal, vat_amount, total, notes || null, req.user.id]
    );
    for (const it of items) {
      const lineTotal = Math.round(Number(it.qty) * Number(it.unit_price) * 100) / 100;
      await conn.query(
        `INSERT INTO quotation_items (quotation_id, product_id, description, qty, unit_price, vat_rate, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [result.insertId, it.product_id || null, it.description, it.qty, it.unit_price, vatRate, lineTotal]
      );
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId, quote_no: quoteNo });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await pool.query('UPDATE quotations SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { client_id, quote_date, valid_until, notes, items, vat_rate } = req.body;
  if (!client_id || !quote_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'client_id, quote_date and at least one item are required' });
  }
  const vatRate = vat_rate !== undefined ? Number(vat_rate) : 5;
  const { subtotal, vat_amount, total } = computeTotals(items, vatRate);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE quotations SET client_id=?, quote_date=?, valid_until=?, subtotal=?, vat_amount=?, total=?, notes=? WHERE id=?`,
      [client_id, quote_date, valid_until || null, subtotal, vat_amount, total, notes || null, req.params.id]
    );
    await conn.query('DELETE FROM quotation_items WHERE quotation_id = ?', [req.params.id]);
    for (const it of items) {
      const lineTotal = Math.round(Number(it.qty) * Number(it.unit_price) * 100) / 100;
      await conn.query(
        `INSERT INTO quotation_items (quotation_id, product_id, description, qty, unit_price, vat_rate, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, it.product_id || null, it.description, it.qty, it.unit_price, vatRate, lineTotal]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.post('/:id/convert-to-invoice', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [quoteRows] = await conn.query('SELECT * FROM quotations WHERE id = ? FOR UPDATE', [req.params.id]);
    const quote = quoteRows[0];
    if (!quote) {
      await conn.rollback();
      return res.status(404).json({ error: 'Quotation not found' });
    }
    const [items] = await conn.query('SELECT * FROM quotation_items WHERE quotation_id = ?', [req.params.id]);

    const invoiceNo = await nextNumber(conn, 'INV');
    const invoiceDate = req.body.invoice_date || new Date().toISOString().slice(0, 10);
    const [invResult] = await conn.query(
      `INSERT INTO sales_invoices (invoice_no, client_id, quotation_id, invoice_date, subtotal, vat_amount, total, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`,
      [invoiceNo, quote.client_id, quote.id, invoiceDate, quote.subtotal, quote.vat_amount, quote.total, req.user.id]
    );

    for (const it of items) {
      await conn.query(
        `INSERT INTO sales_invoice_items (invoice_id, product_id, description, qty, unit_price, vat_rate, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invResult.insertId, it.product_id, it.description, it.qty, it.unit_price, it.vat_rate, it.line_total]
      );
      if (it.product_id) {
        await conn.query(
          `INSERT INTO stock_movements (product_id, type, qty, ref_table, ref_id, created_by) VALUES (?, 'sale', ?, 'sales_invoices', ?, ?)`,
          [it.product_id, -Math.abs(it.qty), invResult.insertId, req.user.id]
        );
        await conn.query('UPDATE products SET qty_on_hand = qty_on_hand - ? WHERE id = ?', [it.qty, it.product_id]);
      }
    }

    await conn.query('UPDATE quotations SET status = "accepted" WHERE id = ?', [quote.id]);
    await conn.commit();
    res.status(201).json({ invoiceId: invResult.insertId, invoice_no: invoiceNo });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM quotations WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
