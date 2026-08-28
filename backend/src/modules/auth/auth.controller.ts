import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendCreated, sendSuccess } from '../../utils/apiResponse'
import { ApiError } from '../../utils/ApiError'
import * as authService from './auth.service'

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body)
  sendCreated(res, user, 'สมัครสมาชิกสำเร็จ')
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body)
  sendSuccess(res, result, 'เข้าสู่ระบบสำเร็จ')
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refresh(req.body.refreshToken)
  sendSuccess(res, tokens, 'ออก access token ใหม่สำเร็จ')
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken)
  sendSuccess(res, null, 'ออกจากระบบแล้ว')
})

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized()
  await authService.changePassword(req.user.sub, req.body)
  sendSuccess(res, null, 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่')
})

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body)
  sendSuccess(res, result, 'ยืนยันตัวตนสำเร็จ — ใช้ resetToken นี้ตั้งรหัสผ่านใหม่ภายในเวลาที่กำหนด')
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body)
  sendSuccess(res, null, 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบใหม่')
})
