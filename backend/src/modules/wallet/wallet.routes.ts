import { Router } from 'express'
import * as controller from './wallet.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { topupWalletSchema } from './wallet.schema'

// ต้อง login เสมอ — กระเป๋าเงินผูกกับบัญชีผู้ใช้ 1:1
const router = Router()

router.get('/', requireAuth, controller.getMyWallet)
router.post('/topup', requireAuth, validate(topupWalletSchema), controller.topupWallet)

export default router
