import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendNoContent, sendSuccess } from '../../utils/apiResponse'
import { ApiError } from '../../utils/ApiError'
import * as userService from './user.service'

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized()
  const user = await userService.getById(req.user.sub)
  sendSuccess(res, user)
})

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getById(Number(req.params.id))
  sendSuccess(res, user)
})

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await userService.list(req.query as { page?: string; limit?: string; search?: string })
  sendSuccess(res, { items, meta })
})

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized()
  const user = await userService.update(Number(req.params.id), req.user, req.body)
  sendSuccess(res, user, 'แก้ไขข้อมูลผู้ใช้สำเร็จ')
})

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized()
  await userService.remove(Number(req.params.id), req.user)
  sendNoContent(res)
})

export const checkUsername = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.checkUsername(req.params.username)
  sendSuccess(res, result)
})
