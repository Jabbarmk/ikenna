const path = require('path');
const xlsx = require('xlsx');
const pool = require('./pool');

const FILE_PATH = path.resolve(__dirname, '../../../PRODUCT LIST (2) (2).XLSX');

async function seed() {
  const wb = xlsx.readFile(FILE_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const code = String(row['Material code'] || '').trim();
    const description = String(row['Material Description'] || '').trim();
    const unit = String(row['Base Unit of Measure'] || 'EA').trim() || 'EA';

    if (!code || !description) {
      skipped += 1;
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO products (code, description, unit, cost_price, sale_price, reorder_level, qty_on_hand)
         VALUES (?, ?, ?, 0, 0, 0, 0)
         ON DUPLICATE KEY UPDATE description = VALUES(description), unit = VALUES(unit)`,
        [code, description, unit]
      );
      inserted += 1;
    } catch (err) {
      console.error(`Failed row code=${code}:`, err.message);
      skipped += 1;
    }
  }

  console.log(`Seed complete. Inserted/updated: ${inserted}, skipped: ${skipped}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
