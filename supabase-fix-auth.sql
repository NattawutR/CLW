-- ================================================
-- ชาละวัน ออโต้ — Fix Auth (Local Dropdown)
-- เนื่องจากเราเปลี่ยนไปใช้ Local Dropdown (ไม่ได้ผูกกับ Supabase Auth จริง)
-- จึงต้องปลดล็อคข้อจำกัด UUID และ RLS เพื่อให้ใช้งานได้
-- ================================================

-- 1. ลบ Foreign Key ที่ผูกกับ auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. อนุญาตให้ทุกคน (รวมถึงผู้ใช้ที่ไม่ได้ login ผ่าน Supabase) เข้าถึงข้อมูลได้ทั้งหมด
-- (ระบบ Security จะถูกจัดการผ่าน Frontend ที่เราเขียนไว้แทน)

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_all" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- INCOME CATEGORIES
DROP POLICY IF EXISTS "income_cat_select" ON income_categories;
DROP POLICY IF EXISTS "income_cat_insert" ON income_categories;
DROP POLICY IF EXISTS "income_cat_update" ON income_categories;
DROP POLICY IF EXISTS "income_cat_delete" ON income_categories;
CREATE POLICY "income_cat_all" ON income_categories FOR ALL USING (true) WITH CHECK (true);

-- EXPENSE CATEGORIES
DROP POLICY IF EXISTS "expense_cat_select" ON expense_categories;
DROP POLICY IF EXISTS "expense_cat_insert" ON expense_categories;
DROP POLICY IF EXISTS "expense_cat_update" ON expense_categories;
DROP POLICY IF EXISTS "expense_cat_delete" ON expense_categories;
CREATE POLICY "expense_cat_all" ON expense_categories FOR ALL USING (true) WITH CHECK (true);

-- PRODUCTS
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_all" ON products FOR ALL USING (true) WITH CHECK (true);

-- INCOMES
DROP POLICY IF EXISTS "incomes_select" ON incomes;
DROP POLICY IF EXISTS "incomes_insert" ON incomes;
DROP POLICY IF EXISTS "incomes_update" ON incomes;
DROP POLICY IF EXISTS "incomes_delete" ON incomes;
CREATE POLICY "incomes_all" ON incomes FOR ALL USING (true) WITH CHECK (true);

-- EXPENSES
DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- FIXED COSTS
DROP POLICY IF EXISTS "fixed_costs_select" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_insert" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_update" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_delete" ON fixed_costs;
CREATE POLICY "fixed_costs_all" ON fixed_costs FOR ALL USING (true) WITH CHECK (true);

-- CAPITAL
DROP POLICY IF EXISTS "capital_select" ON capital;
DROP POLICY IF EXISTS "capital_insert" ON capital;
DROP POLICY IF EXISTS "capital_update" ON capital;
DROP POLICY IF EXISTS "capital_delete" ON capital;
CREATE POLICY "capital_all" ON capital FOR ALL USING (true) WITH CHECK (true);

-- 3. สร้างข้อมูล Profiles สำหรับระบบ Local Dropdown
-- ลบข้อมูลเก่าถ้ามี
DELETE FROM profiles;

-- ใช้ UUID จำลองสำหรับแต่ละคน
INSERT INTO profiles (id, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ฟิล์ม', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'ฟ้า', 'co_admin'),
  ('33333333-3333-3333-3333-333333333333', 'พี่กอล์ฟ', 'staff'),
  ('44444444-4444-4444-4444-444444444444', 'พี่เอฟ', 'staff'),
  ('55555555-5555-5555-5555-555555555555', 'แม่', 'owner');
