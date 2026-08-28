import { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ApiError } from '../utils/ApiError'
import { ApiErrorBody } from '../utils/apiResponse'

export function notFound(req: Request, res: Response): void {
  const body: ApiErrorBody = { success: false, message: `ไม่พบ endpoint: ${req.method} ${req.originalUrl}` }
  res.status(404).json(body)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const body: ApiErrorBody = {
        success: false,
        message: 'ข้อมูลนี้มีอยู่ในระบบแล้ว',
        error: { fields: err.meta?.target },
      }
      res.status(409).json(body)
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการ' } as ApiErrorBody)
      return
    }
  }

  if (err instanceof ApiError) {
    const body: ApiErrorBody = { success: false, message: err.message, error: err.details }
    res.status(err.statusCode).json(body)
    return
  }

  console.error(err)
  const body: ApiErrorBody = { success: false, message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' }
  res.status(500).json(body)
}
