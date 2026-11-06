const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/dashboard', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [[todaySales]] = await pool.query(
    `SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS count FROM sales_invoices WHERE invoice_date = ? AND status != 'cancelled'`,
    [today]
  );
  const [[receivables]] = await pool.query(`
    SELECT COALESCE(SUM(c.opening_balance + COALESCE(inv.invoiced,0) - COALESCE(inv.paid,0) - COALESCE(ret.returned,0)),0) AS total
    FROM clients c
    LEFT JOIN (SELECT client_id, SUM(total) AS invoiced, SUM(paid_amount) AS paid FROM sales_invoices WHERE status != 'cancelled' GROUP BY client_id) inv ON inv.client_id = c.id
    LEFT JOIN (SELECT client_id, SUM(total) AS returned FROM sales_returns GROUP BY client_id) ret ON ret.client_id = c.id
  `);
  const [[payables]] = await pool.query(`
    SELECT COALESCE(SUM(s.opening_balance + COALESCE(p.purchased,0) - COALESCE(p.paid,0)),0) AS total
    FROM suppliers s
    LEFT JOIN (SELECT supplier_id, SUM(total) AS purchased, SUM(paid_amount) AS paid FROM purchases WHERE status != 'cancelled' GROUP BY supplier_id) p ON p.supplier_id = s.id
  `);
  const [[lowStock]] = await pool.query(`SELECT COUNT(*) AS count FROM products WHERE qty_on_hand <= reorder_level AND is_active = 1`);
  const [[openLeads]] = await pool.query(`SELECT COUNT(*) AS count FROM leads WHERE status NOT IN ('converted','lost')`);
  const [[openQuotes]] = await pool.query(`SELECT COUNT(*) AS count FROM quotations WHERE status IN ('draft','sent')`);
  const [[stockValue]] = await pool.query(`SELECT COALESCE(SUM(qty_on_hand * cost_price),0) AS total FROM products WHERE is_active = 1`);

  const [salesTrend] = await pool.query(`
    SELECT invoice_date AS date, SUM(total) AS total
    FROM sales_invoices
    WHERE status != 'cancelled' AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    GROUP BY invoice_date ORDER BY invoice_date
  `);

  const [[monthSales]] = await pool.query(`
    SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS count
    FROM sales_invoices
    WHERE status != 'cancelled' AND invoice_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  `);

  const [[monthPurchases]] = await pool.query(`
    SELECT COALESCE(SUM(total),0) AS total
    FROM purchases
    WHERE status != 'cancelled' AND purchase_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  `);

  const [invoiceStatusBreakdown] = await pool.query(`
    SELECT status, COUNT(*) AS count, COALESCE(SUM(total),0) AS total
    FROM sales_invoices WHERE status != 'cancelled' GROUP BY status
  `);

  const [recentInvoices] = await pool.query(`
    SELECT i.id, i.invoice_no, i.invoice_date, i.total, i.status, c.name AS client_name
    FROM sales_invoices i JOIN clients c ON c.id = i.client_id
    ORDER BY i.created_at DESC LIMIT 6
  `);

  const [recentLeads] = await pool.query(`
    SELECT id, name, company, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5
  `);

  const [lowStockItems] = await pool.query(`
    SELECT id, code, description, unit, qty_on_hand, reorder_level
    FROM products WHERE is_active = 1 AND qty_on_hand <= reorder_level
    ORDER BY (reorder_level - qty_on_hand) DESC LIMIT 6
  `);

  const [topProducts] = await pool.query(`
    SELECT p.id, p.description, p.unit, SUM(i.qty) AS qty_sold, SUM(i.line_total) AS revenue
    FROM sales_invoice_items i
    JOIN sales_invoices inv ON inv.id = i.invoice_id AND inv.status != 'cancelled'
    JOIN products p ON p.id = i.product_id
    WHERE inv.invoice_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY p.id, p.description, p.unit
    ORDER BY revenue DESC LIMIT 5
  `);

  res.json({
    todaySales: todaySales.total,
    todaySalesCount: todaySales.count,
    monthSales: monthSales.total,
    monthSalesCount: monthSales.count,
    monthPurchases: monthPurchases.total,
    receivables: receivables.total,
    payables: payables.total,
    lowStockCount: lowStock.count,
    openLeads: openLeads.count,
    openQuotes: openQuotes.count,
    stockValue: stockValue.total,
    salesTrend,
    invoiceStatusBreakdown,
    recentInvoices,
    recentLeads,
    lowStockItems,
    topProducts,
  });
}));

router.get('/stock', asyncHandler(async (req, res) => {
  const { lowStockOnly } = req.query;
  const where = lowStockOnly === 'true' ? 'WHERE qty_on_hand <= reorder_level AND is_active = 1' : 'WHERE is_active = 1';
  const [rows] = await pool.query(
    `SELECT id, code, description, unit, qty_on_hand, reorder_level, cost_price, sale_price, (qty_on_hand * cost_price) AS stock_value
     FROM products ${where} ORDER BY description`
  );
  res.json(rows);
}));

router.get('/sales', asyncHandler(async (req, res) => {
  const { from, to, client_id } = req.query;
  const where = ["i.status != 'cancelled'"];
  const params = [];
  if (from) {
    where.push('i.invoice_date >= ?');
    params.push(from);
  }
  if (to) {
    where.push('i.invoice_date <= ?');
    params.push(to);
  }
  if (client_id) {
    where.push('i.client_id = ?');
    params.push(client_id);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT i.id, i.invoice_no, i.invoice_date, c.name AS client_name, i.subtotal, i.vat_amount, i.total, i.paid_amount, i.status
     FROM sales_invoices i JOIN clients c ON c.id = i.client_id ${whereSql} ORDER BY i.invoice_date DESC`,
    params
  );
  const [[totals]] = await pool.query(
    `SELECT COALESCE(SUM(i.subtotal),0) AS subtotal, COALESCE(SUM(i.vat_amount),0) AS vat_amount, COALESCE(SUM(i.total),0) AS total
     FROM sales_invoices i ${whereSql}`,
    params
  );
  res.json({ items: rows, totals });
}));

router.get('/purchases', asyncHandler(async (req, res) => {
  const { from, to, supplier_id } = req.query;
  const where = ["p.status != 'cancelled'"];
  const params = [];
  if (from) {
    where.push('p.purchase_date >= ?');
    params.push(from);
  }
  if (to) {
    where.push('p.purchase_date <= ?');
    params.push(to);
  }
  if (supplier_id) {
    where.push('p.supplier_id = ?');
    params.push(supplier_id);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT p.id, p.purchase_no, p.purchase_date, s.name AS supplier_name, p.subtotal, p.vat_amount, p.total, p.paid_amount, p.status
     FROM purchases p JOIN suppliers s ON s.id = p.supplier_id ${whereSql} ORDER BY p.purchase_date DESC`,
    params
  );
  const [[totals]] = await pool.query(
    `SELECT COALESCE(SUM(p.subtotal),0) AS subtotal, COALESCE(SUM(p.vat_amount),0) AS vat_amount, COALESCE(SUM(p.total),0) AS total
     FROM purchases p ${whereSql}`,
    params
  );
  res.json({ items: rows, totals });
}));

module.exports = router;
