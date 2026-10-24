import fs from 'fs'
import path from 'path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import { env, isProduction } from './config/env'
import apiRouter from './routes'
import { notFound, errorHandler } from './middleware/error.middleware'

const app = express()

// ตอน deploy (เช่น Render) มี reverse proxy อยู่หน้าแอป — ต้องบอก Express ให้เชื่อ header X-Forwarded-For
// ไม่งั้น req.ip จะเป็น IP ของ proxy ทำให้ rate limit นับรวมทุกคนเป็นคนเดียวกัน (ปรับจำนวนชั้นได้ด้วย TRUST_PROXY)
if (isProduction) app.set('trust proxy', Number(process.env.TRUST_PROXY || 1))

// ปิด CSP ของ helmet เพราะหน้าเว็บโหลดแผนที่/ฟอนต์จากโดเมนภายนอก (OpenStreetMap/CartoDB) — header อื่นของ helmet ยังทำงานปกติ
app.use(helmet({ contentSecurityPolicy: false, referrerPolicy: { policy: 'strict-origin-when-cross-origin' } }))
app.use(cors({ origin: env.corsOrigin.length ? env.corsOrigin : true, credentials: true }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
// จำกัด 3mb — พอสำหรับรูปโปรไฟล์ที่ frontend ย่อเป็น data URL แล้วก่อนส่ง (ปกติเล็กกว่านี้มาก)
app.use(express.json({ limit: '3mb' }))
app.use(cookieParser())

app.use('/api/v1', apiRouter)

// production: ให้ backend เสิร์ฟหน้าเว็บที่ build แล้ว (frontend/dist) ด้วย — เหลือ service เดียว ไม่ต้องใช้ CORS
// (ตอนพัฒนายังใช้ Vite dev server ที่ :5173 ตามเดิม)
const clientDir = path.resolve(__dirname, '../../frontend/dist')
if (isProduction && fs.existsSync(path.join(clientDir, 'index.html'))) {
  app.use(express.static(clientDir))
  // เส้นทางของหน้าเว็บ (เช่น /route/12) ที่ไม่ใช่ไฟล์และไม่ใช่ /api → ส่ง index.html ให้ React Router จัดการต่อ
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

export default app
