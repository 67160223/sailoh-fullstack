import { Response } from 'express'

// รูปแบบ response มาตรฐานของทั้งระบบ — ทุก endpoint ตอบกลับด้วยรูปทรงนี้เสมอ
// success: true  -> { success, message?, data }
// success: false -> { success, message, error? } (ยิงจาก error middleware)
export interface ApiSuccessBody<T> {
  success: true
  message?: string
  data: T
}

export interface ApiErrorBody {
  success: false
  message: string
  error?: unknown
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const body: ApiSuccessBody<T> = { success: true, data }
  if (message) body.message = message
  return res.status(statusCode).json(body)
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201)
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send()
}
