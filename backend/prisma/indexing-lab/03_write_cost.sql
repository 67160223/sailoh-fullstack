-- ต้นทุนของ index: เขียนข้อมูลช้าลงเท่าไร (ทุกอย่างอยู่ใน transaction แล้ว ROLLBACK ไม่ทิ้งข้อมูลจริง)
-- รันหลังใส่ migration 00000000000008 แล้ว
\timing on
\echo '\n--- INSERT users 100,000 แถว  (มี trigram index 2 ตัว) ---'
BEGIN;
INSERT INTO users (username, email, "passwordHash", "updatedAt")
SELECT 'w' || md5(g::text) || g, 'w' || md5(g::text) || g || '@example.com', 'x', now()
FROM generate_series(1, 100000) g;
ROLLBACK;

\echo '\n--- INSERT users 100,000 แถว  (ลบ trigram index ชั่วคราวใน transaction เดียวกัน) ---'
BEGIN;
DROP INDEX users_username_trgm_idx;
DROP INDEX users_email_trgm_idx;
INSERT INTO users (username, email, "passwordHash", "updatedAt")
SELECT 'w' || md5(g::text) || g, 'w' || md5(g::text) || g || '@example.com', 'x', now()
FROM generate_series(1, 100000) g;
ROLLBACK;
