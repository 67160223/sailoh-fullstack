import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AuthUser } from '../types/express'

interface UserLike {
  id: number
  username: string
  role: 'USER' | 'ADMIN'
}

export function signAccessToken(user: UserLike): string {
  return jwt.sign({ sub: user.id, username: user.username, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires,
  } as jwt.SignOptions)
}

export function signRefreshToken(user: UserLike): string {
  return jwt.sign({ sub: user.id }, env.jwtRefreshSecret, {
    expiresIn: `${env.jwtRefreshExpiresDays}d`,
  })
}

export function verifyAccessToken(token: string): AuthUser {
  return jwt.verify(token, env.jwtAccessSecret) as unknown as AuthUser
}

export function verifyRefreshToken(token: string): { sub: number } {
  return jwt.verify(token, env.jwtRefreshSecret) as unknown as { sub: number }
}

// reset token แยก secret จาก access/refresh เดิมทั้งคู่ — กันเอา token ที่รั่วจากช่องทางหนึ่ง
// ไปใช้สวมสิทธิ์อีกช่องทางได้ (เช่น เอา reset token ไปยิง endpoint ที่ต้องใช้ access token)
export function signResetToken(userId: number): string {
  return jwt.sign({ sub: userId, purpose: 'password-reset' }, env.jwtResetSecret, {
    expiresIn: env.jwtResetExpires,
  } as jwt.SignOptions)
}

export function verifyResetToken(token: string): { sub: number; purpose: string } {
  // jwt.verify() คืน string | JwtPayload — JwtPayload ไม่มีฟิลด์ purpose เลย (ไม่ใช่แค่ optional)
  // จึง cast ตรงไม่ได้ ต้องผ่าน unknown ก่อนตามที่ TS แนะนำ
  return jwt.verify(token, env.jwtResetSecret) as unknown as { sub: number; purpose: string }
}
