-- Adds a company logo (stored as a base64 data-URI) to company_settings.
-- Safe to re-run.

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'company_settings' AND COLUMN_NAME = 'logo'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE company_settings ADD COLUMN logo MEDIUMTEXT NULL AFTER peppol_id',
  'SELECT ''company_settings.logo already exists, skipping'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
