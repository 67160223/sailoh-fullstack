import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendCreated, sendNoContent, sendSuccess } from '../../utils/apiResponse'
import * as routeService from './route.service'

export const listRoutes = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await routeService.list(req.query as { page?: string; limit?: string; search?: string })
  sendSuccess(res, { items, meta })
})

export const searchRoutes = asyncHandler(async (req: Request, res: Response) => {
  const items = await routeService.search(String(req.query.q ?? ''))
  sendSuccess(res, items)
})

export const getRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.getById(Number(req.params.id))
  sendSuccess(res, route)
})

export const createRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.create(req.body)
  sendCreated(res, route, 'สร้างสายรถเมล์สำเร็จ')
})

export const updateRoute = asyncHandler(async (req: Request, res: Response) => {
  const route = await routeService.update(Number(req.params.id), req.body)
  sendSuccess(res, route, 'แก้ไขสายรถเมล์สำเร็จ')
})

export const deleteRoute = asyncHandler(async (req: Request, res: Response) => {
  await routeService.remove(Number(req.params.id))
  sendNoContent(res)
})
