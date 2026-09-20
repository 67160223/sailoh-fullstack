import rateLimit from 'express-rate-limit'
import { ApiErrorBody } from '../utils/apiResponse'

// จำกัดความถี่ POST /auth/login — ป้องกัน brute-force เดารหัสผ่าน
// 5 ครั้ง ต่อ 15 นาที ต่อ IP หนึ่ง ๆ (ค่ามาตรฐานที่ใช้กันทั่วไปสำหรับ login endpoint)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 5,
  standardHeaders: true, // ส่ง header RateLimit-* กลับไปให้ client เช็คได้ว่าเหลือกี่ครั้ง
  legacyHeaders: false,
  handler: (_req, res) => {
    const body: ApiErrorBody = {
      success: false,
      message: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่',
    }
    res.status(429).json(body)
  },
})

// จำกัดความถี่ POST /auth/register — ป้องกันสแปมสร้างบัญชีจำนวนมาก
// ให้มากกว่า login เล็กน้อยเพราะโอกาสพิมพ์ผิดตอนสมัครมีมากกว่าตอน login ปกติ
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const body: ApiErrorBody = {
      success: false,
      message: 'สร้างบัญชีบ่อยเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่',
    }
    res.status(429).json(body)
  },
})