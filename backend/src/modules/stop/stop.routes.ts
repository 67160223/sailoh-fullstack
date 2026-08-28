import { Router } from 'express'
import * as controller from './stop.controller'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { addStopSchema, updateStopSchema } from './stop.schema'

// mount ที่ /routes/:id/stops — เพิ่มป้ายในสาย (ADMIN)
export const nestedStopRouter = Router({ mergeParams: true })
nestedStopRouter.post('/', requireAuth, requireRole('ADMIN'), validate(addStopSchema), controller.addStop)

// mount ที่ /stops/:stopId — แก้ไข/ลบป้าย (ADMIN)
export const stopRouter = Router()
stopRouter.put('/:stopId', requireAuth, requireRole('ADMIN'), validate(updateStopSchema), controller.updateStop)
stopRouter.delete('/:stopId', requireAuth, requireRole('ADMIN'), controller.deleteStop)
