# ทดลอง Indexing บน PostgreSQL (โปรเจกต์สายเลข)

ทดลองบน database แยก `sailoh_lab` (ข้อมูลจำลอง ~2.3 ล้านแถว) database จริง `sailoh` ไม่ถูกแตะ

## วิธีรัน
```
cd C:\sailoh-fullstack\backend\prisma\indexing-lab
.\run-lab.bat
```
ผลอยู่ใน `results\` (before / after / write_cost / index_size) หรือรันทีละไฟล์ด้วย `psql -U postgres -d sailoh_lab -f 02_queries.sql`

## Index ที่เพิ่ม (migration `00000000000008_performance_indexes`)
| Index | query จริงในโค้ด | เหตุผล |
|---|---|---|
| `refresh_tokens(userId)` | `refreshToken.updateMany({ where: { userId } })` (auth.service: logout-all, เปลี่ยนรหัสผ่าน) | FK ไม่มี index อัตโนมัติ ทำให้ Seq Scan |
| GIN trigram `users(username)`, `users(email)` | `contains + mode: insensitive` = `ILIKE '%คำ%'` (user.service) | B-tree ใช้ไม่ได้เมื่อมี `%` นำหน้า |

ไม่ได้ทำ index บน `routes` เพราะมีไม่กี่สาย Postgres เลือก Seq Scan เองและเร็วกว่า (index ที่ไม่ถูกใช้มีแต่ต้นทุนเขียน)
ส่วน index ที่มีอยู่แล้ว (`wallet_transactions(walletId,createdAt)`, `tickets(userId,purchasedAt)`) ใช้เป็นกลุ่มเทียบ (Q3, Q4)

## ผลที่วัดได้ (เครื่องผม Postgres 16 — ของคุณจะตัวเลขต่างกัน แต่แนวโน้มเหมือนกัน)
| Query | ก่อน | หลัง | Scan |
|---|---|---|---|
| Q1 revoke token ของ user หนึ่งคน | 79 ms | 0.5 ms | Seq Scan → Bitmap Index Scan |
| Q2 ค้นผู้ใช้ ILIKE '%a3f9%' (หน้า 1) | 235 ms | 0.9 ms | Index Scan บน pkey แล้วกรอง → BitmapOr ของ 2 GIN |
| Q2 count ของคำค้นเดียวกัน | 148 ms | 0.3 ms | Parallel Seq Scan → BitmapOr |
| Q3 ประวัติกระเป๋าเงิน (มี index เดิม) | 0.27 ms | 0.08 ms | Bitmap Index Scan ทั้งสองรอบ |
| Q5 กรองเฉพาะ `createdAt` | 139 ms | 195 ms | Seq Scan ทั้งสองรอบ (ดูข้อ Leftmost) |

**ต้นทุนการเขียน** (03_write_cost.sql): insert users 100,000 แถว ใช้ 10.2 s เมื่อมี trigram index 2 ตัว เทียบ 2.2 s เมื่อไม่มี (ช้าลง ~4.6 เท่า)
**พื้นที่**: trigram index ของ users ใหญ่ 28 + 32 MB เทียบกับตารางเอง 59 MB; `refresh_tokens(userId)` 8.5 MB

## สิ่งที่ควรสรุปส่งอาจารย์
1. **Index ช่วยอ่าน แต่เพิ่มต้นทุนเขียนและพื้นที่** — เลือกเฉพาะ query ที่ใช้จริงและตารางใหญ่
2. **ดูจาก `EXPLAIN (ANALYZE, BUFFERS)`** ไม่ใช่เดา: เปลี่ยนจาก Seq Scan เป็น Index/Bitmap Scan และ Execution Time ลดลง
3. **Leftmost rule (Q5):** composite `(walletId, createdAt)` ช่วยเมื่อกรอง `walletId` (ซ้ายสุด) แต่ query ที่กรองเฉพาะ `createdAt` ใช้ไม่ได้ ต้องมี index แยกถ้าต้องการจริง
4. **`LIKE '%x%'` ใช้ B-tree ไม่ได้** ต้องใช้ GIN + `pg_trgm`
5. **FK ใน Postgres ไม่มี index ให้อัตโนมัติ** (ต่างจาก MySQL/InnoDB) เป็นต้นเหตุของ Q1
6. ตารางเล็ก (routes) Postgres เลือก Seq Scan เอง ซึ่งถูกต้อง

## ใช้กับ database จริงของโปรเจกต์
`cd backend` แล้ว `npx prisma migrate deploy` จะใส่ migration 08 (ใช้ `migrate deploy` ไม่ใช่ `migrate dev` เพราะ Prisma ไม่รู้จัก GIN trigram index ใน schema และ `migrate dev` อาจเสนอให้ลบทิ้ง) `CREATE EXTENSION pg_trgm` ต้องรันด้วยบัญชีที่เป็นเจ้าของ database ซึ่ง `sailoh` เป็นอยู่แล้วตาม setup.bat
