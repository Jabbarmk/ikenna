-- Adds Peppol ID to company_settings for existing databases.
-- Safe to re-run: skips the ALTER if the column already exists.
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'company_settings' AND COLUMN_NAME = 'peppol_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE company_settings ADD COLUMN peppol_id VARCHAR(60) DEFAULT ''0235:1006082182'' AFTER po_box',
  'SELECT ''peppol_id already exists, skipping'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE company_settings SET peppol_id = '0235:1006082182' WHERE id = 1 AND (peppol_id IS NULL OR peppol_id = '');
