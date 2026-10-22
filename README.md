# 67160223 นายบูรพา โพธิ์ศรี
# 67160228 นายพิสิษฐ์สรรค์ ปรีชา
# สายเลข — เช็คสายรถเมล์ Real-time

รวม backend (`backend/`) กับ frontend (`frontend/`) ไว้ในโปรเจกต์เดียว เปิด/รันจากที่เดียว
ไม่ต้องสับเปลี่ยนไปมาระหว่างสองโฟลเดอร์แยกกันอีก

```
sailoh-fullstack/
├── start.bat            ← ดับเบิลคลิกอันเดียว ตั้งค่า + เปิดเว็บให้ครบ
├── stop-db.bat          ← ปิดฐานข้อมูลที่ start.bat เปิดไว้
├── scripts/             ← สคริปต์ช่วยของ start.bat (ฐานข้อมูลพกพา, สร้าง .env)
├── backend/             ← เดิมคือ bus-tracking-api (TypeScript + Express + Prisma + PostgreSQL)
└── frontend/            ← เดิมคือ final-bus-tracker (React + Vite)
```

## วิธีรัน (โคลนจาก GitHub แล้วกด start.bat เลย — Windows)

ต้องติดตั้งก่อนแค่ **Git** และ **Node.js (LTS)** — ไม่ต้องติดตั้ง PostgreSQL และไม่ต้องใช้รหัสผ่านใด ๆ

```powershell
git clone https://github.com/67160223/sailoh-fullstack.git
cd sailoh-fullstack
.\start.bat
```

หรือดับเบิลคลิก `start.bat` ในโฟลเดอร์ได้เลย

ครั้งแรก `start.bat` จะตั้งค่าทุกอย่างให้เอง (ใช้เวลาหลายนาที): หา/ดาวน์โหลด PostgreSQL แบบพกพามาไว้ในโฟลเดอร์ `.pg`
(รันที่พอร์ต 5433 รับเฉพาะการเชื่อมต่อจากเครื่องตัวเอง ไม่ชนกับ PostgreSQL ตัวอื่นที่พอร์ต 5432), สร้างฐานข้อมูล,
สร้าง `backend/.env` พร้อมค่า JWT แบบสุ่มของเครื่องนั้น, ติดตั้งแพ็กเกจ, ใส่ข้อมูลตัวอย่าง แล้วเปิดเบราว์เซอร์ที่ http://localhost:5173
ครั้งต่อไปกด `start.bat` เปิดเร็วเลย ปิดฐานข้อมูลด้วย `stop-db.bat` บัญชีผู้ดูแลที่ seed ให้: `admin` / `Admin@1234`

หลัง `git pull` ที่มีการแก้ฐานข้อมูล ให้รัน `npx prisma migrate deploy` ในโฟลเดอร์ `backend` เพิ่ม

ถ้าดาวน์โหลด PostgreSQL แบบพกพาไม่ได้ ให้ติดตั้ง PostgreSQL ตามปกติ แล้วรัน `start.bat` ซ้ำ (สคริปต์ใช้แค่ไฟล์โปรแกรมของมัน ไม่ต้องรู้รหัสผ่าน)

ถ้ามี `backend/.env` อยู่แล้ว (ชี้ไป PostgreSQL ของเครื่องเอง) `start.bat` จะใช้ฐานข้อมูลตามไฟล์นั้นและไม่สร้างฐานข้อมูลพกพา

## Flow การใช้งาน

1. เข้าเว็บ → เห็นหน้าหลักได้เลยทันที **ไม่ต้อง login** — ค้นหาสาย, ดูตำแหน่ง/ETA ได้แบบสาธารณะ
2. มุมขวาบน: ปุ่ม **⚙️ ตั้งค่า** (ใช้ได้ทุกคน — สลับโหมดสว่าง/มืด) และตามด้วยปุ่ม **"เข้าระบบ"** (ยังไม่ login)
   หรือ **avatar** (login แล้ว — รูปโปรไฟล์หรือตัวอักษรแรก)
3. ในหน้ารายละเอียดสาย กดแท็บ **"แผนที่"** เพื่อดูแผนที่จริงแบบ pan/zoom ได้ (OpenStreetMap/CartoDB) —
   เห็นตำแหน่งป้ายทุกป้ายและตำแหน่งรถล่าสุดถ้ามีข้อมูล GPS แล้ว สลับกับแท็บ "รายการป้าย" ได้ตลอด
4. ฟีเจอร์ที่ต้อง login: บันทึกสาย, หน้า "สายที่บันทึก" — กดตอนยังไม่ login จะเด้งไปหน้า login ให้เอง
5. สมัครสมาชิก/ลืมรหัสผ่านทำได้ในตัว ไม่ต้องพึ่งอีเมลจริง (ดูรายละเอียดด้านล่าง)
6. หน้าโปรไฟล์: ดู/แก้ไขข้อมูลตัวเอง, **เปลี่ยน/ลบรูปโปรไฟล์**, เปลี่ยนรหัสผ่าน, ออกจากระบบ
7. บัญชี role `ADMIN` จะเห็นลิงก์ไปหน้า Admin Dashboard (`/admin/users`) จัดการสมาชิกทั้งระบบได้

## Endpoints ทั้งหมด (prefix: `/api/v1`)

### Authentication
| Method | Path | คำอธิบาย |
|---|---|---|
| POST | `/auth/register` | สมัครสมาชิก |
| POST | `/auth/login` | เข้าสู่ระบบ → คืน `accessToken` + `refreshToken` |
| POST | `/auth/refresh` | ขอ access token ใหม่ (rotate ให้ทั้งคู่) |
| POST | `/auth/logout` | ออกจากระบบ (เพิกถอน `refreshToken`) |
| POST | `/auth/change-password` | เปลี่ยนรหัสผ่านตอน login อยู่ |
| POST | `/auth/forgot-password` | ลืมรหัสผ่าน — ยืนยันด้วย username+email คืน `resetToken` |
| POST | `/auth/reset-password` | ตั้งรหัสผ่านใหม่ด้วย `resetToken` |

### User Management
| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/users/me` | ดึงข้อมูลตัวเอง |
| GET | `/users` | รายชื่อผู้ใช้ทั้งหมด `?page=&limit=&search=` (ADMIN) |
| GET | `/users/:id` | ดึงผู้ใช้ตาม ID |
| PUT | `/users/:id` | แก้ไข `email`, `displayName`, `avatarUrl`, `role` (role: ADMIN เท่านั้น) |
| DELETE | `/users/:id` | ลบผู้ใช้ |
| GET | `/users/check-username/:username` | เช็ค username ว่าง (สาธารณะ) |

### Bus Routes (Core Business Logic)
| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/routes` | รายการสาย `?page=&limit=&search=` (สาธารณะ) |
| GET | `/routes/search?q=` | auto-suggest (สาธารณะ) |
| GET | `/routes/:id` | รายละเอียดสาย (สาธารณะ) |
| POST/PUT/DELETE | `/routes(/:id)` | จัดการสาย (ADMIN) |
| POST/PUT/DELETE | `/routes/:id/stops`, `/stops/:stopId` | จัดการป้าย (ADMIN) |
| GET | `/routes/:id/location` | ตำแหน่งรถล่าสุด (สาธารณะ) |
| POST | `/routes/:id/location` | อัปเดตตำแหน่งรถ (ADMIN) |
| GET | `/routes/:id/eta?stopId=` | ประมาณเวลาถึง (สาธารณะ) |
| GET/POST/DELETE | `/favorites(/:routeId)` | สายที่บันทึกไว้ (ต้อง login) |

รวม 28 endpoints — รายละเอียดฉบับเต็มพร้อมตัวอย่าง curl อยู่ในคอมเมนต์ของแต่ละไฟล์ใน `backend/src/modules/`

## โครงสร้างย่อยของแต่ละส่วน

**`backend/`** — Express + TypeScript + Prisma, แยกเป็น module (`auth`, `user`, `route`, `stop`,
`tracking`, `favorite`) แต่ละอันมี `*.schema.ts` (zod) / `*.service.ts` / `*.controller.ts` / `*.routes.ts`
ของตัวเอง Response format มาตรฐานทั้งระบบ: `{ success, data, message }` หรือ `{ success, message, error }`

**`frontend/`** — React + Vite, มี `AuthContext` (access/refresh token + auto-refresh),
`FavoritesContext`, `RouteGuards` (`ProtectedRoute`/`GuestOnly`/`AdminRoute`), หน้า Login/Register/
ForgotPassword/Profile/AdminUsers/AdminUserDetail ครบ

**แผนที่จริงในหน้ารายละเอียดสาย** — แท็บ "แผนที่" ในหน้า `/route/:id` ใช้แผนที่จริง pan/zoom ได้
(Leaflet + OpenStreetMap/CartoDB ฟรี ไม่ต้องขอ API key เหมือน Google Maps) แสดงเส้นทางเดินรถ
เชื่อมป้ายตามลำดับ, ป้ายถัดไปไฮไลต์สีเหลืองอำพัน, และไอคอนรถเมล์ 🚌 ที่ตำแหน่งล่าสุดจาก GPS จริง
สีเปลี่ยนตามสถานะ — ชุด tile ของแผนที่เองก็สลับสว่าง/มืดตามธีมแอปด้วย — component อยู่ที่
`frontend/src/components/RouteMap.jsx`

**โหมดสว่าง/มืด** — `ThemeContext` (`frontend/src/context/ThemeContext.jsx`) จำค่าไว้ใน
`localStorage`, ใช้ค่า `prefers-color-scheme` ของเบราว์เซอร์เป็นค่าเริ่มต้นถ้ายังไม่เคยตั้งเอง
สลับได้จากปุ่ม ⚙️ ที่มุมขวาบนทุกหน้า (`/settings`) ไม่ต้อง login เพราะเป็นการตั้งค่าเครื่อง
ไม่ใช่ข้อมูลบัญชี ทั้งแอปใช้ CSS custom properties (`--bg`, `--surface`, `--text` ฯลฯ ใน
`frontend/src/index.css`) จึงสลับสีทั้งแอปพร้อมกันได้จากจุดเดียว ไม่ต้องแก้ทีละ component

## หมายเหตุด้านความปลอดภัยก่อนขึ้น production

- เปลี่ยน `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `JWT_RESET_SECRET` เป็นค่าสุ่มยาว ๆ ของจริง
- จำกัด `CORS_ORIGIN` ใน `backend/.env` ให้เป็นโดเมน frontend จริงเท่านั้น
- เพิ่ม rate limiting ที่ `/auth/login`, `/auth/register` กัน brute-force
- `forgot-password` คืน `resetToken` ตรงใน response เพราะโปรเจกต์นี้ไม่มีระบบส่งอีเมล — ของจริงต้อง
  ส่งทางอีเมลเท่านั้น
- `avatarUrl` เก็บเป็น data URL (base64) ตรงในฐานข้อมูล เพื่อความง่าย — ของจริงควรใช้ object storage
  (S3, Cloudinary ฯลฯ) แล้วเก็บแค่ URL แทน
