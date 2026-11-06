const pool = require('../db/pool');

const FIELD_BY_PREFIX = {
  QTN: 'quote_next',
  PO: 'purchase_next',
  INV: 'invoice_next',
  SR: 'return_next',
};

async function nextNumber(conn, prefix) {
  const field = FIELD_BY_PREFIX[prefix];
  const [rows] = await conn.query(`SELECT ${field} AS n FROM company_settings WHERE id = 1 FOR UPDATE`);
  const n = rows[0].n;
  await conn.query(`UPDATE company_settings SET ${field} = ? WHERE id = 1`, [n + 1]);
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

module.exports = { nextNumber };
