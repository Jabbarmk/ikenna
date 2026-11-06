const express = require('express');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM company_settings WHERE id = 1');
  res.json(rows[0]);
}));

router.put('/', asyncHandler(async (req, res) => {
  const { name, trn, address, phone, email, po_box, vat_rate } = req.body;
  await pool.query(
    `UPDATE company_settings SET name=?, trn=?, address=?, phone=?, email=?, po_box=?, vat_rate=? WHERE id = 1`,
    [name, trn, address, phone, email, po_box, vat_rate]
  );
  res.json({ ok: true });
}));

module.exports = router;
