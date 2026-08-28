import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import { env } from './config/env'
import apiRouter from './routes'
import { notFound, errorHandler } from './middleware/error.middleware'

const app = express()

// แก้ไขบรรทัดที่ 13-14 ใน backend/src/app.ts

app.use(cors({ origin: env.corsOrigin.length ? env.corsOrigin : true, credentials: true }))
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
// จำกัด 3mb — พอสำหรับรูปโปรไฟล์ที่ frontend ย่อเป็น data URL แล้วก่อนส่ง (ปกติเล็กกว่านี้มาก)
app.use(express.json({ limit: '3mb' }))
app.use(cookieParser())

app.use('/api/v1', apiRouter)

app.use(notFound)
app.use(errorHandler)

export default app
