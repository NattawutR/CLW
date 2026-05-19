-- ================================================
-- ชาละวัน ออโต้ — Seed Data
-- รันหลังจาก supabase-schema.sql แล้ว
-- ================================================

-- ========== ลบ seed เดิม (ถ้ามี) ==========
DELETE FROM income_categories;
DELETE FROM expense_categories;
DELETE FROM capital;

-- ========== ประเภทรายรับ (Income Categories) ==========
INSERT INTO income_categories (name, is_active) VALUES
  ('ฟิล์ม', true),
  ('เครื่องเสียง', true),
  ('กล้อง', true),
  ('ขายอะไหล่', true),
  ('ค่าแรงซ่อม', true),
  ('ล้างรถ', true),
  ('เคลือบสี / ขัดสี', true),
  ('ค่าบริการอื่นๆ', true);

-- ========== ประเภทรายจ่าย (Expense Categories) ==========
INSERT INTO expense_categories (name, is_active) VALUES
  ('ซื้ออะไหล่', true),
  ('ซื้อฟิล์ม', true),
  ('ซื้อเครื่องเสียง', true),
  ('ซื้อกล้อง', true),
  ('ค่าน้ำ', true),
  ('ค่าไฟ', true),
  ('ค่าเช่า', true),
  ('ค่าอินเทอร์เน็ต', true),
  ('เงินเดือน', true),
  ('การตลาด', true),
  ('ค่าเดินทาง', true),
  ('ค่าใช้จ่ายอื่นๆ', true);

-- ========== เงินทุนตั้งต้น 20,000 บาท ==========
INSERT INTO capital (type, amount, note, date, created_by) VALUES
  ('inject', 20000.00, 'เงินทุนตั้งต้น', CURRENT_DATE, NULL);

-- ========== ตัวอย่างสินค้า/บริการ (Products) ==========
INSERT INTO products (name, category_id, unit, price, is_active) VALUES
  ('ฟิล์มกรองแสง 40%', (SELECT id FROM income_categories WHERE name = 'ฟิล์ม'), 'คัน', 2500.00, true),
  ('ฟิล์มกรองแสง 60%', (SELECT id FROM income_categories WHERE name = 'ฟิล์ม'), 'คัน', 3500.00, true),
  ('ฟิล์มกรองแสง 80%', (SELECT id FROM income_categories WHERE name = 'ฟิล์ม'), 'คัน', 5000.00, true),
  ('เครื่องเสียงติดรถยนต์ (ชุดเล็ก)', (SELECT id FROM income_categories WHERE name = 'เครื่องเสียง'), 'ชุด', 3000.00, true),
  ('เครื่องเสียงติดรถยนต์ (ชุดใหญ่)', (SELECT id FROM income_categories WHERE name = 'เครื่องเสียง'), 'ชุด', 8000.00, true),
  ('ซับวูฟเฟอร์', (SELECT id FROM income_categories WHERE name = 'เครื่องเสียง'), 'ตัว', 4500.00, true),
  ('กล้องหน้ารถ', (SELECT id FROM income_categories WHERE name = 'กล้อง'), 'ตัว', 1500.00, true),
  ('กล้องหน้า-หลัง', (SELECT id FROM income_categories WHERE name = 'กล้อง'), 'ชุด', 2500.00, true),
  ('กล้อง 360 องศา', (SELECT id FROM income_categories WHERE name = 'กล้อง'), 'ชุด', 6000.00, true),
  ('ล้างรถเล็ก', (SELECT id FROM income_categories WHERE name = 'ล้างรถ'), 'ครั้ง', 100.00, true),
  ('ล้างรถใหญ่', (SELECT id FROM income_categories WHERE name = 'ล้างรถ'), 'ครั้ง', 150.00, true);
