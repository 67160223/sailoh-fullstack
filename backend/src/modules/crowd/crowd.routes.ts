import { Router } from 'express'
import * as controller from './crowd.controller'
import { optionalAuth } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { createCrowdReportSchema } from './crowd.schema'

// mount ที่ /routes/:id — อ่านสาธารณะ, รายงานได้แม้ไม่ login (optionalAuth) เหมือน status-reports
export const crowdRouter = Router({ mergeParams: true })

crowdRouter.get('/crowd', controller.getCrowdSummary)
crowdRouter.post('/crowd', optionalAuth, validate(createCrowdReportSchema), controller.createCrowdReport)
