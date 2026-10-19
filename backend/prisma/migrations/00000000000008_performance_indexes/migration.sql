-- Performance indexes (ผลจากการทดลองใน prisma/indexing-lab)

-- 1) ค้นข้อความแบบ ILIKE '%คำ%' (user.service search): B-tree ใช้ไม่ได้เพราะมี % นำหน้า
--    ใช้ GIN + trigram แทน (pg_trgm เป็น trusted extension เจ้าของ database สร้างได้เอง)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "users_username_trgm_idx" ON "users" USING GIN ("username" gin_trgm_ops);
CREATE INDEX "users_email_trgm_idx"    ON "users" USING GIN ("email" gin_trgm_ops);

-- 2) refreshToken.updateMany({ where: { userId } }) ตอน logout-all / เปลี่ยนรหัสผ่าน
--    userId เป็น foreign key แต่ Postgres ไม่สร้าง index ให้ FK อัตโนมัติ
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
