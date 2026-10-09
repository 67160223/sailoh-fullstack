import { Router } from 'express'
import * as controller from './statusReport.controller'
import { optionalAuth } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { createStatusReportSchema, listStatusReportQuerySchema } from './statusReport.schema'

// mount ที่ /routes/:id — เหมือน trackingRouter: อ่านสาธารณะ, รายงานได้แม้ไม่ login (optionalAuth)
// เป็นฟีเจอร์ crowd-sourced status แทนที่การไม่มี GPS จริง — ผู้ใช้ช่วยกันอัปเดตสถานะรถให้กันเอง
export const statusReportRouter = Router({ mergeParams: true })

statusReportRouter.get('/status-reports', validate(listStatusReportQuerySchema, 'query'), controller.listStatusReports)
statusReportRouter.post(
  '/status-reports',
  optionalAuth,
  validate(createStatusReportSchema),
  controller.createStatusReport
)
