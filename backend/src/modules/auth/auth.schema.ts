import { z } from 'zod'

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'username ต้องยาวอย่างน้อย 3 ตัว')
    .max(20, 'username ต้องยาวไม่เกิน 20 ตัว')
    .regex(/^[a-zA-Z0-9_]+$/, 'username ใช้ได้เฉพาะตัวอักษร/เลข/underscore'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'),
  displayName: z.string().min(1).max(100).optional(),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอก username'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'ต้องส่ง refreshToken'),
})

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'ต้องส่ง refreshToken'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร'),
})

// ลืมรหัสผ่าน — ยืนยันตัวตนด้วย username + email ที่ตรงกับบัญชี (ไม่มีระบบส่งอีเมลจริง
// ในโปรเจกต์นี้ จึงคืน resetToken กลับมาตรง ๆ ใน response; ของจริงต้องส่งทางอีเมลเท่านั้น)
export const forgotPasswordSchema = z.object({
  username: z.string().min(1, 'กรุณากรอก username'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
})

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'ต้องส่ง resetToken'),
  newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
