import { randomBytes } from 'crypto'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

const ticketInclude = { route: { select: { id: true, number: true, name: true } } }

function generateTicketCode() {
  return 'TK' + randomBytes(5).toString('hex').toUpperCase()
}

// ซื้อตั๋วอิเล็กทรอนิกส์ — หักเงินจากกระเป๋า + สร้างตั๋วในทรานแซกชันเดียวกัน กันยอดเงิน/ตั๋วไม่ตรงกัน
export async function purchase(userId: number, routeId: number) {
  const route = await prisma.route.findUnique({ where: { id: routeId } })
  if (!route) throw ApiError.notFound('ไม่พบสายรถเมล์นี้')

  return prisma.$transaction(async (tx) => {
    // ผู้ใช้ทุกคนมีกระเป๋าเงินอัตโนมัติ ไม่ต้องให้สร้างเองก่อน
    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    })

    if (wallet.balance < route.fare) {
      throw ApiError.badRequest('เงินในกระเป๋าไม่พอ กรุณาเติมเงินก่อนซื้อตั๋ว', {
        code: 'INSUFFICIENT_BALANCE',
        required: route.fare,
        balance: wallet.balance,
      })
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: route.fare } },
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'TICKET_PURCHASE',
        amount: -route.fare,
        balanceAfter: updatedWallet.balance,
        note: `ซื้อตั๋วสาย ${route.number}`,
      },
    })

    return tx.ticket.create({
      data: { code: generateTicketCode(), userId, routeId, price: route.fare },
      include: ticketInclude,
    })
  })
}

export async function listMine(userId: number) {
  return prisma.ticket.findMany({
    where: { userId },
    orderBy: { purchasedAt: 'desc' },
    include: ticketInclude,
  })
}

// จำลองการสแกนตอนขึ้นรถ — ในระบบจริงกระเป๋ารถ/คนขับจะเป็นคนสแกน แต่โปรเจกต์นี้ยังไม่มีอุปกรณ์จริง
// จึงให้ผู้ใช้กดยืนยันเองแทน (ปุ่ม "ใช้ตั๋วนี้" ในหน้าตั๋วของฉัน)
export async function useTicket(userId: number, ticketId: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket || ticket.userId !== userId) throw ApiError.notFound('ไม่พบตั๋วนี้')
  if (ticket.status !== 'UNUSED') throw ApiError.conflict('ตั๋วนี้ถูกใช้ไปแล้ว หรือหมดอายุแล้ว')

  return prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'USED', usedAt: new Date() },
    include: ticketInclude,
  })
}
