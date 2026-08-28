import { NextFunction, Request, Response } from 'express'
import { ZodSchema } from 'zod'
import { ApiError } from '../utils/ApiError'

type Part = 'body' | 'query' | 'params'

// ใช้: router.post('/x', validate(createSchema), controller)
// ตรวจ + แทนที่ req[part] ด้วยผลลัพธ์ parse แล้ว (ได้ type ที่ narrow ลงและค่า default ที่ schema กำหนด)
export function validate(schema: ZodSchema, part: Part = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part])
    if (!result.success) {
      return next(ApiError.badRequest('ข้อมูลไม่ถูกต้อง', result.error.flatten()))
    }
    req[part] = result.data
    next()
  }
}
