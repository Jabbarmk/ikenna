-- Adds Terms & Conditions templates, selectable on quotations and invoices.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS terms_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  applies_to ENUM('quotation','invoice','both') NOT NULL DEFAULT 'both',
  body TEXT NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET @q_col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotations' AND COLUMN_NAME = 'terms_template_id'
);
SET @sql = IF(@q_col_exists = 0,
  'ALTER TABLE quotations ADD COLUMN terms_template_id INT NULL AFTER notes, ADD COLUMN terms_text TEXT AFTER terms_template_id, ADD CONSTRAINT fk_quotations_terms FOREIGN KEY (terms_template_id) REFERENCES terms_templates(id) ON DELETE SET NULL',
  'SELECT ''quotations.terms_template_id already exists, skipping'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @i_col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_invoices' AND COLUMN_NAME = 'terms_template_id'
);
SET @sql = IF(@i_col_exists = 0,
  'ALTER TABLE sales_invoices ADD COLUMN terms_template_id INT NULL AFTER notes, ADD COLUMN terms_text TEXT AFTER terms_template_id, ADD CONSTRAINT fk_invoices_terms FOREIGN KEY (terms_template_id) REFERENCES terms_templates(id) ON DELETE SET NULL',
  'SELECT ''sales_invoices.terms_template_id already exists, skipping'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
