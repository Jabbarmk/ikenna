const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { q, status } = req.query;
  const where = [];
  const params = [];
  if (q) {
    where.push('(name LIKE ? OR company LIKE ? OR phone LIKE ? OR email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM leads ${whereSql} ORDER BY created_at DESC`, params);
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Lead not found' });
  res.json(rows[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, phone, email, company, source, status, notes, assigned_to } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const [result] = await pool.query(
    `INSERT INTO leads (name, phone, email, company, source, status, notes, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, phone || null, email || null, company || null, source || null, status || 'new', notes || null, assigned_to || null]
  );
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { name, phone, email, company, source, status, notes, assigned_to } = req.body;
  await pool.query(
    `UPDATE leads SET name=?, phone=?, email=?, company=?, source=?, status=?, notes=?, assigned_to=? WHERE id=?`,
    [name, phone || null, email || null, company || null, source || null, status, notes || null, assigned_to || null, req.params.id]
  );
  res.json({ ok: true });
}));

router.post('/:id/convert', asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [leadRows] = await conn.query('SELECT * FROM leads WHERE id = ? FOR UPDATE', [req.params.id]);
    const lead = leadRows[0];
    if (!lead) {
      await conn.rollback();
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (lead.status === 'converted' && lead.converted_client_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Lead already converted' });
    }

    const { address, trn, opening_balance } = req.body || {};
    const [clientResult] = await conn.query(
      `INSERT INTO clients (name, company, phone, email, address, trn, opening_balance, converted_from_lead_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [lead.name, lead.company, lead.phone, lead.email, address || null, trn || null, opening_balance || 0, lead.id]
    );
    await conn.query('UPDATE leads SET status = "converted", converted_client_id = ? WHERE id = ?', [clientResult.insertId, lead.id]);
    await conn.commit();
    res.status(201).json({ clientId: clientResult.insertId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
