import { NextFunction, Request, Response } from 'express'

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

// ครอบ controller async ทุกตัว — error ที่ throw จะไหลไปที่ error middleware อัตโนมัติ
export function asyncHandler(fn: AsyncFn) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
