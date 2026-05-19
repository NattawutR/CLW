-- ================================================
-- ชาละวัน ออโต้ — Grant Permissions
-- ให้สิทธิ์ role "anon" เข้าถึงตารางได้ (เพราะเราใช้ระบบล็อคอินจำลอง)
-- ================================================

-- ให้สิทธิ์การใช้งาน schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ให้สิทธิ์เข้าถึงทุกตาราง
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- ให้สิทธิ์การใช้งาน Auto-increment IDs (Sequences)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
