import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './StatusReportPanel.css'

// ตัวเลือกสถานะที่รายงานได้ — ให้ตรงกับ enum ReportStatus ฝั่ง backend (statusReport.schema.ts)
const STATUS_OPTIONS = [
  { value: 'ARRIVED', label: 'รถมาถึงป้ายนี้แล้ว', icon: '🚌' },
  { value: 'ON_TIME', label: 'มาตรงเวลา', icon: '🟢' },
  { value: 'DELAYED', label: 'รถล่าช้า', icon: '🟡' },
  { value: 'CROWDED', label: 'รถแน่นมาก', icon: '🟠' },
  { value: 'NOT_COMING', label: 'รถไม่มา/ยกเลิกรอบนี้', icon: '🔴' },
]

const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o]))

const POLL_MS = 45 * 1000 // รีเฟรชสถานะทุก 45 วิ พอสำหรับ demo โดยไม่ต้องใช้ WebSocket

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  return `${Math.round(mins / 60)} ชม.ที่แล้ว`
}

/**
 * แผงรายงาน/แสดงสถานะแบบ crowd-sourced จากผู้ใช้จริง — จุดต่างจากแอปที่พึ่ง GPS จริงอย่างเดียว
 * ใช้ได้ทั้งแบบ login และไม่ login (รายงานแบบไม่ login ได้ แต่จะกันสแปมได้แค่ตอน login)
 *
 * props:
 * - routeId: number
 * - stops: [{ id, name, sequence }]   ใช้เป็นตัวเลือกป้ายตอนรายงาน
 */
export default function StatusReportPanel({ routeId, stops = [] }) {
  const { authFetch } = useAuth()
  const [reports, setReports] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedStop, setSelectedStop] = useState(stops[0]?.id ?? '')
  const [selectedStatus, setSelectedStatus] = useState('ARRIVED')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  const loadReports = useCallback(() => {
    authFetch(`/routes/${routeId}/status-reports`)
      .then((data) => setReports(data))
      .catch(() => {}) // ไม่มีรายงานล่าสุดก็แค่ไม่แสดง badge ไม่ใช่ error ที่ต้องเด้งแจ้งผู้ใช้
  }, [authFetch, routeId])

  useEffect(() => {
    loadReports()
    const timer = setInterval(loadReports, POLL_MS)
    return () => clearInterval(timer)
  }, [loadReports])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedStop) return
    setSubmitting(true)
    setFeedback('')
    try {
      await authFetch(`/routes/${routeId}/status-reports`, {
        method: 'POST',
        body: { stopId: Number(selectedStop), status: selectedStatus },
      })
      setFeedback('ส่งรายงานแล้ว ขอบคุณที่ช่วยอัปเดต 🙏')
      setOpen(false)
      loadReports()
    } catch (err) {
      setFeedback(err.message || 'ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="status-report">
      {reports.length > 0 && (
        <ul className="status-report__feed">
          {reports.map((r) => {
            const meta = STATUS_LABEL[r.status]
            return (
              <li key={r.id} className="status-report__feed-item">
                <span className="status-report__feed-icon">{meta?.icon}</span>
                <span className="status-report__feed-text">
                  <strong>{r.stop?.name}</strong> — {meta?.label}
                </span>
                <span className="status-report__feed-time">{timeAgo(r.createdAt)}</span>
              </li>
            )
          })}
        </ul>
      )}

      {!open ? (
        <button type="button" className="status-report__cta" onClick={() => setOpen(true)}>
          📢 รายงานสถานะรถ
        </button>
      ) : (
        <form className="status-report__form" onSubmit={handleSubmit}>
          <label className="status-report__field">
            ป้าย
            <select value={selectedStop} onChange={(e) => setSelectedStop(e.target.value)} required>
              {stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="status-report__options" role="radiogroup" aria-label="สถานะรถ">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`status-report__option${selectedStatus === opt.value ? ' is-active' : ''}`}
                onClick={() => setSelectedStatus(opt.value)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>

          <div className="status-report__actions">
            <button type="submit" className="status-report__submit" disabled={submitting}>
              {submitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
            </button>
            <button type="button" className="status-report__cancel" onClick={() => setOpen(false)}>
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {feedback && <p className="status-report__feedback">{feedback}</p>}
    </div>
  )
}
