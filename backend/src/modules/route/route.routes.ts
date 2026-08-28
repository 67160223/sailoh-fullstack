import { Router } from 'express'
import * as controller from './route.controller'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { createRouteSchema, updateRouteSchema } from './route.schema'

const router = Router()

// อ่านได้แบบสาธารณะ — ไม่ต้อง login ก็ค้นหาสายรถเมล์ได้
router.get('/', controller.listRoutes)
router.get('/search', controller.searchRoutes)
router.get('/:id', controller.getRoute)

router.post('/', requireAuth, requireRole('ADMIN'), validate(createRouteSchema), controller.createRoute)
router.put('/:id', requireAuth, requireRole('ADMIN'), validate(updateRouteSchema), controller.updateRoute)
router.delete('/:id', requireAuth, requireRole('ADMIN'), controller.deleteRoute)

export default router
