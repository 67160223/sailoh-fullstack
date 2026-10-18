import { Router } from 'express'
import * as controller from './trip.controller'
import { validate } from '../../middleware/validate.middleware'
import { planTripQuerySchema } from './trip.schema'

// สาธารณะทั้งหมด (ไม่ต้อง login) — เหมือนการค้นหาสายรถเมล์
// GET /trips/stops → ชื่อป้ายไม่ซ้ำทั้งหมด (ไว้ทำ autocomplete)
// GET /trips/plan?from=..&to=.. → สายที่นั่งตรงจากต้นทางไปปลายทาง
const router = Router()

router.get('/stops', controller.listStopNames)
router.get('/plan', validate(planTripQuerySchema, 'query'), controller.planTrip)

export default router
