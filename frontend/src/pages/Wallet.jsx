import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import QrCode from '../components/QrCode'
import './Wallet.css'

const QUICK_AMOUNTS = [50, 100, 200, 500]

const TX_LABEL = {
  TOPUP: 'เติมเงิน',
  TICKET_PURCHASE: 'ซื้อตั๋ว',
  REFUND: 'คืนเงิน',
}

const TICKET_STATUS_LABEL = {
  UNUSED: 'ยังไม่ใช้',
  USED: 'ใช้แล้ว',
  EXPIRED: 'หมดอายุ',
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// หน้ากระเป๋าเงินในแอป (e-Wallet) — โมเดลหารายได้แทนระบบ Premium/freemium เดิม
// เติมเงิน (เดโม mock ไม่มี payment gateway จริง) แล้วใช้ซื้อตั๋วอิเล็กทรอนิกส์ก่อนขึ้นรถได้จากหน้าสายรถเมล์
export default function WalletPage() {
  const { authFetch } = useAuth()

  const [wallet, setWallet] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [customAmount, setCustomAmount] = useState('')
  const [topping, setTopping] = useState(false)
  const [topupMsg, setTopupMsg] = useState('')

  const [usingTicketId, setUsingTicketId] = useState(null)
  const [ticketErr, setTicketErr] = useState('')
  const [qrTicketId, setQrTicketId] = useState(null) // ตั๋วที่กางแสดง QR อยู่ (แสดงทีละใบ)

  function loadAll() {
    setLoading(true)
    setLoadError('')
    Promise.all([authFetch('/wallet'), authFetch('/tickets/me')])
      .then(([walletData, ticketsData]) => {
        setWallet(walletData)
        setTickets(ticketsData)
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleTopup(amount) {
    if (!amount || amount <= 0) return
    setTopping(true)
    setTopupMsg('')
    try {
      const updated = await authFetch('/wallet/topup', { method: 'POST', body: { amount } })
      setWallet((prev) => ({ ...prev, balance: updated.balance }))
      setTopupMsg(`เติมเงินสำเร็จ +${amount.toLocaleString('th-TH')} บาท (โหมดเดโม ยังไม่มีการเก็บเงินจริง)`)
      setCustomAmount('')
      loadAll()
    } catch (err) {
      setTopupMsg(err.message || 'เติมเงินไม่สำเร็จ')
    } finally {
      setTopping(false)
    }
  }

  async function handleUseTicket(ticketId) {
    setUsingTicketId(ticketId)
    setTicketErr('')
    try {
      const updated = await authFetch(`/tickets/${ticketId}/use`, { method: 'POST' })
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)))
    } catch (err) {
      setTicketErr(err.message || 'ใช้ตั๋วไม่สำเร็จ')
    } finally {
      setUsingTicketId(null)
    }
  }

  if (loading) return <div className="page wallet"><p className="empty-state">กำลังโหลด...</p></div>

  return (
    <div className="page wallet">
      <Link to="/" className="wallet__back">← กลับ</Link>

      <header className="wallet__header">
        <p className="eyebrow">กระเป๋าเงิน</p>
        <h1>กระเป๋าเงินในแอป</h1>
      </header>

      {loadError && <p className="empty-state">โหลดไม่สำเร็จ: {loadError}</p>}

      {wallet && (
        <>
          <section className="wallet__balance-card">
            <p className="wallet__balance-label">ยอดเงินคงเหลือ</p>
            <p className="wallet__balance-amount">{wallet.balance.toLocaleString('th-TH')} <span>บาท</span></p>

            <div className="wallet__quick-amounts">
              {QUICK_AMOUNTS.map((amount) => (
                <button key={amount} type="button" onClick={() => handleTopup(amount)} disabled={topping}>
                  +{amount}
                </button>
              ))}
            </div>

            <form
              className="wallet__custom-topup"
              onSubmit={(e) => { e.preventDefault(); handleTopup(Number(customAmount)) }}
            >
              <input
                type="number"
                min="1"
                max="10000"
                placeholder="ระบุจำนวนเอง (บาท)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <button type="submit" disabled={topping || !customAmount}>
                {topping ? 'กำลังเติม...' : 'เติมเงิน'}
              </button>
            </form>
            {topupMsg && <p className="wallet__topup-msg">{topupMsg}</p>}
            <p className="wallet__disclaimer">* โหมดเดโม ยังไม่เชื่อมต่อระบบชำระเงินจริง</p>
          </section>

          {wallet.transactions?.length > 0 && (
            <section className="wallet__card">
              <p className="wallet__card-title">ประวัติธุรกรรม</p>
              <ul className="wallet__tx-list">
                {wallet.transactions.map((tx) => (
                  <li key={tx.id} className="wallet__tx-row">
                    <div>
                      <strong>{TX_LABEL[tx.type] || tx.type}</strong>
                      <span className="wallet__tx-note">{tx.note}</span>
                      <span className="wallet__tx-date">{formatDateTime(tx.createdAt)}</span>
                    </div>
                    <span className={`wallet__tx-amount${tx.amount < 0 ? ' is-negative' : ' is-positive'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('th-TH')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="wallet__card">
            <p className="wallet__card-title">ตั๋วของฉัน</p>

            {ticketErr && <p className="auth-error">{ticketErr}</p>}

            {tickets.length === 0 ? (
              <p className="wallet__card-desc">ยังไม่มีตั๋ว — ไปที่หน้าสายรถเมล์เพื่อซื้อตั๋วก่อนขึ้นรถได้เลย</p>
            ) : (
              <ul className="wallet__ticket-list">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className={`wallet__ticket wallet__ticket--${ticket.status.toLowerCase()}`}>
                    <div className="wallet__ticket-top">
                      <span className="wallet__ticket-route">สาย {ticket.route.number} · {ticket.route.name}</span>
                      <span className="wallet__ticket-status">{TICKET_STATUS_LABEL[ticket.status]}</span>
                    </div>
                    <p className="wallet__ticket-code">{ticket.code}</p>
                    <div className="wallet__ticket-bottom">
                      <span>{ticket.price.toLocaleString('th-TH')} บาท · ซื้อเมื่อ {formatDateTime(ticket.purchasedAt)}</span>
                      {ticket.status === 'UNUSED' && (
                        <div className="wallet__ticket-actions">
                          <button
                            type="button"
                            className="wallet__ticket-qr-btn"
                            onClick={() => setQrTicketId((prev) => (prev === ticket.id ? null : ticket.id))}
                            aria-expanded={qrTicketId === ticket.id}
                          >
                            {qrTicketId === ticket.id ? 'ซ่อน QR' : '🔳 แสดง QR'}
                          </button>
                          <button
                            type="button"
                            className="wallet__ticket-use-btn"
                            onClick={() => handleUseTicket(ticket.id)}
                            disabled={usingTicketId === ticket.id}
                          >
                            {usingTicketId === ticket.id ? 'กำลังใช้...' : 'ใช้ตั๋วนี้ (ขึ้นรถแล้ว)'}
                          </button>
                        </div>
                      )}
                    </div>

                    {ticket.status === 'UNUSED' && qrTicketId === ticket.id && (
                      <div className="wallet__ticket-qr">
                        <QrCode value={`SAILOH:${ticket.code}`} size={200} />
                        <p>ยื่น QR นี้ให้คนขับ/กระเป๋ารถสแกนตอนขึ้นรถ</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
