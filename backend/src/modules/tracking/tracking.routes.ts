import { Router } from 'express'
import * as controller from './tracking.controller'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { upsertLocationSchema, etaQuerySchema } from './tracking.schema'

// mount ที่ /routes/:id — อ่านสาธารณะ (frontend poll ได้โดยไม่ต้อง login), เขียนจำกัด ADMIN
export const trackingRouter = Router({ mergeParams: true })

trackingRouter.get('/location', controller.getLocation)
trackingRouter.get('/eta', validate(etaQuerySchema, 'query'), controller.getEta)
trackingRouter.post('/location', requireAuth, requireRole('ADMIN'), validate(upsertLocationSchema), controller.upsertLocation)
