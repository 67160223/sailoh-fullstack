-- AlterTable: freemium — จำกัดจำนวนสายที่บันทึกได้ฟรี ปลดล็อกไม่จำกัดถ้า isPremium
ALTER TABLE "users" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: โฆษณาท้องถิ่น — ร้านค้าใกล้ป้ายจ่ายเพื่อให้ขึ้นข้อความสั้น ๆ ตรงรายการป้าย
ALTER TABLE "stops" ADD COLUMN "sponsorName" TEXT;
ALTER TABLE "stops" ADD COLUMN "sponsorNote" TEXT;
