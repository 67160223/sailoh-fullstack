import { prisma } from '../../config/prisma'

const RECENT_TX_LIMIT = 20

// ทุกคนมีกระเป๋าเงินอัตโนมัติตอนเรียกใช้ครั้งแรก ไม่ต้องให้ผู้ใช้ "สร้างกระเป๋า" เอง
export async function getOrCreateWallet(userId: number) {
  const existing = await prisma.wallet.findUnique({ where: { userId } })
  if (existing) return existing
  return prisma.wallet.create({ data: { userId, balance: 0 } })
}

export async function getWalletWithHistory(userId: number) {
  const wallet = await getOrCreateWallet(userId)
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: RECENT_TX_LIMIT,
  })
  return { ...wallet, transactions }
}

// เติมเงิน — เดโม mock ไม่มี payment gateway จริง แค่บวกยอดเข้ากระเป๋าทันที
export async function topup(userId: number, amount: number) {
  const wallet = await getOrCreateWallet(userId)

  const [, updatedWallet] = await prisma.$transaction([
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'TOPUP',
        amount,
        balanceAfter: wallet.balance + amount,
        note: 'เติมเงิน (เดโม)',
      },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
  ])

  return updatedWallet
}
