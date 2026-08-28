import bcrypt from 'bcryptjs'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'
import { ApiError } from '../../utils/ApiError'
import { signAccessToken, signRefreshToken, verifyRefreshToken, signResetToken, verifyResetToken } from '../../utils/jwt'
import { RegisterInput, LoginInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema'

function publicUser(user: { passwordHash: string; [k: string]: unknown }) {
  const { passwordHash, ...safe } = user
  return safe
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName || input.username,
    },
  })
  return publicUser(user)
}

async function issueTokenPair(user: { id: number; username: string; role: 'USER' | 'ADMIN' }) {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken, refreshToken }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { username: input.username } })
  if (!user) throw ApiError.unauthorized('username หรือรหัสผ่านไม่ถูกต้อง')

  const ok = await bcrypt.compare(input.password, user.passwordHash)
  if (!ok) throw ApiError.unauthorized('username หรือรหัสผ่านไม่ถูกต้อง')

  const tokens = await issueTokenPair(user)
  return { ...tokens, user: publicUser(user) }
}

export async function refresh(refreshToken: string) {
  let payload: { sub: number }
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw ApiError.unauthorized('refresh token ไม่ถูกต้องหรือหมดอายุ')
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('refresh token ถูกเพิกถอนแล้ว กรุณาเข้าสู่ระบบใหม่')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw ApiError.unauthorized('ไม่พบผู้ใช้')

  // rotate: เพิกถอนของเก่า ออกคู่ใหม่ทั้ง access + refresh กันคนขโมย refresh token เดิมไปใช้ซ้ำ
  await prisma.refreshToken.update({ where: { token: refreshToken }, data: { revoked: true } })
  const tokens = await issueTokenPair(user)
  return tokens
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } })
}

export async function changePassword(userId: number, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.notFound('ไม่พบผู้ใช้')

  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash)
  if (!ok) throw ApiError.unauthorized('รหัสผ่านปัจจุบันไม่ถูกต้อง')

  const passwordHash = await bcrypt.hash(input.newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  // เปลี่ยนรหัสผ่านแล้ว เพิกถอน refresh token เดิมทั้งหมด บังคับ login ใหม่ทุกอุปกรณ์
  await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } })
}

// ลืมรหัสผ่าน (ยังไม่ login) — ยืนยันตัวตนด้วย username + email ที่ต้องตรงกับบัญชีเดียวกัน
// โปรเจกต์นี้ไม่มีระบบส่งอีเมลจริง จึงคืน resetToken ตรง ๆ ใน response เพื่อให้ทดสอบได้ครบ flow
// ของจริงต้องส่ง resetToken ไปทางอีเมลเท่านั้น ห้ามคืนใน response
export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { username: input.username } })
  // ข้อความเดียวกันไม่ว่า username หรือ email จะผิดจุดไหน กัน enumerate ว่า username ไหนมีอยู่จริง
  if (!user || user.email.toLowerCase() !== input.email.toLowerCase()) {
    throw ApiError.notFound('ไม่พบบัญชีที่ตรงกับ username และอีเมลนี้')
  }

  const resetToken = signResetToken(user.id)
  return { resetToken, expiresIn: env.jwtResetExpires }
}

export async function resetPassword(input: ResetPasswordInput) {
  let payload: { sub: number; purpose: string }
  try {
    payload = verifyResetToken(input.resetToken)
  } catch {
    throw ApiError.unauthorized('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอใหม่')
  }
  if (payload.purpose !== 'password-reset') {
    throw ApiError.unauthorized('token นี้ใช้รีเซ็ตรหัสผ่านไม่ได้')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw ApiError.notFound('ไม่พบผู้ใช้')

  const passwordHash = await bcrypt.hash(input.newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  // ตั้งรหัสผ่านใหม่แล้ว เพิกถอน refresh token เดิมทั้งหมด บังคับ login ใหม่ทุกอุปกรณ์เหมือนกับ change-password
  await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } })
}
