import { z } from 'zod'

// จำกัดเพดานเติมเงินต่อครั้ง — กันการทดสอบ/กดเล่นเติมจำนวนเวอร์เกินจริง (ระบบนี้เป็นเดโม ไม่มี payment gateway จริง)
export const topupWalletSchema = z.object({
  amount: z.number().int().positive().max(10000, 'เติมเงินได้ไม่เกิน 10,000 บาทต่อครั้ง'),
})
