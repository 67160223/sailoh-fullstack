-- เส้นทางจริงตามถนน (road-snapped geometry) สำหรับวาดเส้นสายรถเมล์บนแผนที่ให้ตรงกับถนนจริง
-- ได้มาจาก routing engine ภายนอก (ดู scripts/fetch-route-geometry.ts) ไม่ใช่ข้อมูลที่ต้องมีเสมอ
-- (เป็น null ได้ถ้ายังไม่เคยรันสคริปต์ — frontend จะ fallback ไปลากเส้นตรงระหว่างป้ายแทน)

-- AlterTable
ALTER TABLE "routes" ADD COLUMN "routeGeometry" JSONB;
