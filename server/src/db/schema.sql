-- Ikenna Kamal General Trading L.L.C. — Inventory & Sales System schema
CREATE DATABASE IF NOT EXISTS ikenna_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ikenna_inventory;

-- ===================== USERS =====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===================== COMPANY SETTINGS =====================
CREATE TABLE IF NOT EXISTS company_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL DEFAULT 'IKENNA KAMAL GENERAL TRADING L.L.C.',
  trn VARCHAR(40) DEFAULT '100608218200003',
  address VARCHAR(255) DEFAULT 'Bintani Building Number 216, Behind Deira Park / Zagy Hotel, Dubai, UAE',
  phone VARCHAR(100) DEFAULT '+971555265418',
  email VARCHAR(160) DEFAULT 'lowiskata4real2007@yahoo.com',
  po_box VARCHAR(40) DEFAULT '377977',
  peppol_id VARCHAR(60) DEFAULT '0235:1006082182',
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  quote_next INT NOT NULL DEFAULT 1,
  purchase_next INT NOT NULL DEFAULT 1,
  invoice_next INT NOT NULL DEFAULT 1,
  return_next INT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===================== LEADS =====================
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(60),
  email VARCHAR(160),
  company VARCHAR(160),
  source VARCHAR(80),
  status ENUM('new','contacted','qualified','lost','converted') NOT NULL DEFAULT 'new',
  notes TEXT,
  assigned_to INT,
  converted_client_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ===================== CLIENTS =====================
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  company VARCHAR(160),
  phone VARCHAR(60),
  email VARCHAR(160),
  address VARCHAR(255),
  trn VARCHAR(40),
  opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  converted_from_lead_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (converted_from_lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_client
  FOREIGN KEY (converted_client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- ===================== SUPPLIERS =====================
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(60),
  email VARCHAR(160),
  address VARCHAR(255),
  trn VARCHAR(40),
  opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===================== PRODUCTS / STOCK =====================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'EA',
  category VARCHAR(100),
  cost_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(14,2) NOT NULL DEFAULT 0,
  qty_on_hand DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_description (description)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('purchase','sale','sale_return','purchase_return','adjustment') NOT NULL,
  qty DECIMAL(14,2) NOT NULL,
  ref_table VARCHAR(40),
  ref_id INT,
  note VARCHAR(255),
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stock_movements_product (product_id)
) ENGINE=InnoDB;

-- ===================== QUOTATIONS =====================
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_no VARCHAR(40) NOT NULL UNIQUE,
  client_id INT NOT NULL,
  status ENUM('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
  quote_date DATE NOT NULL,
  valid_until DATE,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quotation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  product_id INT,
  description VARCHAR(255) NOT NULL,
  qty DECIMAL(14,2) NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  line_total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ===================== PURCHASES =====================
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_no VARCHAR(40) NOT NULL UNIQUE,
  supplier_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  status ENUM('pending','received','cancelled') NOT NULL DEFAULT 'received',
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  qty DECIMAL(14,2) NOT NULL,
  unit_cost DECIMAL(14,2) NOT NULL,
  line_total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ===================== SALES INVOICES =====================
CREATE TABLE IF NOT EXISTS sales_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(40) NOT NULL UNIQUE,
  client_id INT NOT NULL,
  quotation_id INT NULL,
  invoice_date DATE NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  status ENUM('unpaid','partial','paid','cancelled') NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT,
  description VARCHAR(255) NOT NULL,
  qty DECIMAL(14,2) NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  line_total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ===================== SALES RETURNS =====================
CREATE TABLE IF NOT EXISTS sales_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_no VARCHAR(40) NOT NULL UNIQUE,
  invoice_id INT NOT NULL,
  client_id INT NOT NULL,
  return_date DATE NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  reason VARCHAR(255),
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_return_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_id INT NOT NULL,
  product_id INT,
  description VARCHAR(255) NOT NULL,
  qty DECIMAL(14,2) NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL,
  line_total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ===================== PAYMENTS (simple ledger) =====================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  party_type ENUM('client','supplier') NOT NULL,
  party_id INT NOT NULL,
  direction ENUM('in','out') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  method ENUM('cash','bank','card','cheque','other') NOT NULL DEFAULT 'cash',
  ref_type VARCHAR(40),
  ref_id INT,
  payment_date DATE NOT NULL,
  notes VARCHAR(255),
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payments_party (party_type, party_id)
) ENGINE=InnoDB;

INSERT INTO company_settings (id) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 1);
