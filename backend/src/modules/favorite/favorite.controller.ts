import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendCreated, sendNoContent, sendSuccess } from '../../utils/apiResponse'
import { ApiError } from '../../utils/ApiError'
import * as favoriteService from './favorite.service'

export const listFavorites = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized()
  const routes = await favoriteService.list(req.user.sub)
  sendSuccess(res, routes)
})

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized()
  const favorite = await favoriteService.add(req.user.sub, Number(req.params.routeId))
  sendCreated(res, favorite, 'บันทึกสายสำเร็จ')
})

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized()
  await favoriteService.remove(req.user.sub, Number(req.params.routeId))
  sendNoContent(res)
})
