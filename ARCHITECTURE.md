# สายเลข — Architecture & Technology Stack

เอกสารนี้มี 3 ไดอะแกรมสำหรับแปะไว้ใน repo: **Technology Stack**, **สถาปัตยกรรมปัจจุบัน (Current
Architecture)**, และ **แนวคิดการแยกเป็น Microservices (Proposed Decomposition)**

> **หมายเหตุสำคัญ**: backend ของโปรเจคนี้ ณ ตอนนี้เป็น **modular monolith** — คือ Express
> process เดียว ที่แบ่งโค้ดภายในเป็นโมดูล (auth, user, route, stop, tracking, favorite) แต่ยังรัน
> อยู่ใน service เดียวกัน ใช้ฐานข้อมูลเดียวกัน **ไม่ใช่ Microservices จริง** (ต่างจากตัวอย่าง Netflix
> ที่แต่ละ service แยกรันจริง มีฐานข้อมูลของตัวเอง) เอกสารนี้จึงแบ่งเป็น 2 ไดอะแกรม: ของจริงที่มีอยู่
> ตอนนี้ กับแนวคิดว่าถ้าจะแยกเป็น microservices ในอนาคตจะแยกแบบไหน — เพื่อให้ตรงกับความเป็นจริง
> และแสดงว่าเข้าใจแนวคิด microservices โดยไม่ได้อ้างเกินจริงว่าของที่ทำอยู่คือ microservices

---

## 1. Technology Stack Diagram

```mermaid
graph TD
    subgraph FE["Frontend"]
        F1["React 18"]
        F2["Vite"]
        F3["React Router DOM"]
        F4["Leaflet + React-Leaflet<br/>(แผนที่จริง)"]
        F5["Context API<br/>Auth / Favorites / Theme"]
    end

    subgraph BE["Backend"]
        B1["Node.js + TypeScript"]
        B2["Express.js"]
        B3["JWT (jsonwebtoken)<br/>access + refresh + reset token"]
        B4["bcryptjs<br/>เข้ารหัสรหัสผ่าน"]
        B5["Zod<br/>validate request"]
    end

    subgraph DATA["Data Access"]
        C1["Prisma ORM"]
    end

    subgraph DB["Database"]
        D1[("PostgreSQL 16")]
    end

    subgraph INFRA["Infrastructure"]
        E1["Docker"]
        E2["Docker Compose"]
        E3["Nginx<br/>(serve frontend build)"]
        E4["pgAdmin"]
    end

    FE -->|"REST API (JSON)<br/>ผ่าน /api/v1"| BE
    BE --> DATA
    DATA --> DB
    INFRA -.->|"containerize"| FE
    INFRA -.->|"containerize"| BE
    INFRA -.->|"containerize"| DB
```

---

## 2. สถาปัตยกรรมปัจจุบัน (Current Architecture — Modular Monolith)

```mermaid
graph TD
    Client["React Client<br/>(เบราว์เซอร์)"]
    Client -->|"HTTPS REST"| Gateway["Express App<br/>(entry point เดียว)"]

    subgraph Monolith["Backend Server — Node.js process เดียว"]
        Gateway --> Auth["Auth Module"]
        Gateway --> User["User Module"]
        Gateway --> RouteM["Route Module"]
        Gateway --> StopM["Stop Module"]
        Gateway --> Tracking["Tracking Module"]
        Gateway --> Favorite["Favorite Module"]
    end

    Auth --> Prisma["Prisma ORM"]
    User --> Prisma
    RouteM --> Prisma
    StopM --> Prisma
    Tracking --> Prisma
    Favorite --> Prisma
    Prisma --> DB[("PostgreSQL<br/>ฐานข้อมูลเดียว ใช้ร่วมกันทุกโมดูล")]
```

**ทำไมยังไม่ใช่ microservices**: ทุกโมดูล deploy พร้อมกันเป็น container เดียว (`sailoh_api`),
ถ้า module ไหน crash ทั้ง process ล้มหมด, และทุกโมดูลอ่าน/เขียนตาราง Postgres ตารางเดียวกันโดยตรง
ไม่มีการสื่อสารผ่าน network ระหว่างโมดูล (เรียกฟังก์ชันกันตรง ๆ ใน process เดียว)

---

## 3. แนวคิดการแยกเป็น Microservices (Proposed Decomposition — ยังไม่ได้ทำจริง)

ถ้าต้องขยายระบบในอนาคต (เช่น รองรับผู้ใช้จำนวนมาก หรือให้ทีมแยกกันดูแลแต่ละส่วน) แนวทางที่
เหมาะกับโดเมนนี้คือแยกตาม **bounded context**:

```mermaid
graph TD
    Client["React Client"]
    Client --> Gateway["API Gateway"]

    Gateway --> AuthSvc["Auth Service<br/>(login, token, สมัครสมาชิก)"]
    Gateway --> UserSvc["User Service<br/>(โปรไฟล์, admin จัดการสมาชิก)"]
    Gateway --> RouteSvc["Route & Tracking Service<br/>(สาย, ป้าย, ตำแหน่งรถ, ETA)"]
    Gateway --> FavSvc["Favorite Service<br/>(สายที่บันทึกไว้)"]

    AuthSvc --> AuthDB[("Auth DB")]
    UserSvc --> UserDB[("User DB")]
    RouteSvc --> RouteDB[("Route DB")]
    FavSvc --> FavDB[("Favorite DB")]

    RouteSvc -.->|"broadcast: ตำแหน่งรถอัปเดต"| Broker{{"Message Broker<br/>เช่น Redis Pub/Sub"}}
    Broker -.->|"push แบบ real-time"| Client
```

**เหตุผลที่แยกแบบนี้**:
- **Auth Service** แยกออกมาเพราะเรียกใช้บ่อยที่สุดและต้องการความปลอดภัยสูงสุด — scale แยกจากส่วนอื่นได้
- **Route & Tracking Service** มีโหลดสูงสุด (ตำแหน่งรถอัปเดตถี่/ถูก poll บ่อย) ควร scale ออกเป็นหลาย
  instance ได้โดยไม่กระทบส่วนอื่น
- **Favorite Service** เบาที่สุด แยกเพื่อไม่ให้ไปแย่ง resource กับส่วนที่โหลดสูง
- เพิ่ม **Message Broker** สำหรับกรณีอยากได้ตำแหน่งรถแบบ push จริง (ตอนนี้ frontend ยัง poll
  `GET /routes/:id/location` เป็นช่วง ๆ ไม่ใช่ real-time push)

**Trade-off ที่ควรพูดถึงถ้าถูกถาม**: การแยกแบบนี้เพิ่ม complexity มาก (ต้องมี service discovery,
network latency ระหว่าง service, ต้องจัดการ distributed transaction ถ้าจะบันทึก favorite ที่ต้อง
เช็คทั้ง User Service และ Route Service) — สำหรับขนาดโปรเจคนี้ **modular monolith แบบปัจจุบัน
เหมาะสมกว่าจริง ๆ** เพราะจำนวนผู้ใช้และ traffic ยังน้อย การแยก microservices ตอนนี้จะเป็นการ
over-engineer โดยไม่ได้ประโยชน์คุ้มกับต้นทุนที่เพิ่มขึ้น
