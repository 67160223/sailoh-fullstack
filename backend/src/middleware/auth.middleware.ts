import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError'
import { verifyAccessToken } from '../utils/jwt'
import { Role } from '@prisma/client'

// อ่าน access token จาก Authorization: Bearer <token>
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return next(ApiError.unauthorized())

  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    next(ApiError.unauthorized('token ไม่ถูกต้องหรือหมดอายุ'))
  }
}

// ใช้ต่อจาก requireAuth เสมอ — จำกัดเฉพาะ role ที่กำหนด เช่น requireRole('ADMIN')
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden())
    }
    next()
  }
}
