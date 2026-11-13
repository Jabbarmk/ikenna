const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { applies_to } = req.query;
  const where = [];
  const params = [];
  if (applies_to) {
    where.push('(applies_to = ? OR applies_to = "both")');
    params.push(applies_to);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM terms_templates ${whereSql} ORDER BY is_default DESC, name`, params);
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM terms_templates WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Template not found' });
  res.json(rows[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, applies_to, body, is_default } = req.body;
  if (!name || !body) return res.status(400).json({ error: 'name and body are required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (is_default) {
      await conn.query('UPDATE terms_templates SET is_default = 0 WHERE applies_to = ? OR applies_to = "both"', [applies_to || 'both']);
    }
    const [result] = await conn.query(
      'INSERT INTO terms_templates (name, applies_to, body, is_default) VALUES (?, ?, ?, ?)',
      [name, applies_to || 'both', body, is_default ? 1 : 0]
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { name, applies_to, body, is_default } = req.body;
  if (!name || !body) return res.status(400).json({ error: 'name and body are required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (is_default) {
      await conn.query('UPDATE terms_templates SET is_default = 0 WHERE (applies_to = ? OR applies_to = "both") AND id != ?', [applies_to || 'both', req.params.id]);
    }
    await conn.query(
      'UPDATE terms_templates SET name=?, applies_to=?, body=?, is_default=? WHERE id=?',
      [name, applies_to || 'both', body, is_default ? 1 : 0, req.params.id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM terms_templates WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
