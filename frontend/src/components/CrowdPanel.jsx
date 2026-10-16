import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './CrowdPanel.css'

// ระดับความหนาแน่น — ให้ตรงกับ enum CrowdLevel ฝั่ง backend (crowd.schema.ts)
const LEVELS = [
  { value: 'EMPTY', label: 'ว่าง', hint: 'นั่งได้สบาย', icon: '🟢', rank: 1 },
  { value: 'MODERATE', label: 'คนพอดี', hint: 'มีที่ยืน', icon: '🟡', rank: 2 },
  { value: 'FULL', label: 'แน่น', hint: 'แทบไม่มีที่ยืน', icon: '🔴', rank: 3 },
]
const LEVEL_BY_VALUE = Object.fromEntries(LEVELS.map((l) => [l.value, l]))

const POLL_MS = 30 * 1000

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  return `${Math.round(mins / 60)} ชม.ที่แล้ว`
}

/**
 * ความหนาแน่นผู้โดยสารบนรถ — สรุปจากรายงานของผู้ใช้ในช่วง 20 นาทีล่าสุด
 * ใช้ได้ทั้งแบบ login และไม่ login เหมือนแผงรายงานสถานะรถ
 *
 * props:
 * - routeId: number
 */
export default function CrowdPanel({ routeId }) {
  const { authFetch } = useAuth()
  const [summary, setSummary] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  const loadSummary = useCallback(() => {
    authFetch(`/routes/${routeId}/crowd`)
      .then((data) => setSummary(data))
      .catch(() => {}) // โหลดไม่ได้ก็แค่ไม่แสดงสรุป ไม่ใช่ error ที่ต้องเด้งแจ้งผู้ใช้
  }, [authFetch, routeId])

  useEffect(() => {
    loadSummary()
    const timer = setInterval(loadSummary, POLL_MS)
    return () => clearInterval(timer)
  }, [loadSummary])

  async function handleReport(level) {
    setSubmitting(true)
    setFeedback('')
    try {
      const data = await authFetch(`/routes/${routeId}/crowd`, { method: 'POST', body: { level } })
      setSummary(data)
      setFeedback('ส่งรายงานแล้ว ขอบคุณที่ช่วยอัปเดต 🙏')
    } catch (err) {
      setFeedback(err.message || 'ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  const current = summary?.level ? LEVEL_BY_VALUE[summary.level] : null

  return (
    <section className="crowd" aria-label="ความหนาแน่นผู้โดยสาร">
      <p className="eyebrow">ความหนาแน่นบนรถ</p>

      <div className="crowd__summary">
        <div className="crowd__meter" aria-hidden="true">
          {LEVELS.map((l) => (
            <span
              key={l.value}
              className={`crowd__seg crowd__seg--${l.value.toLowerCase()}${current && l.rank <= current.rank ? ' is-on' : ''}`}
            />
          ))}
        </div>
        {current ? (
          <div className="crowd__text">
            <strong>{current.icon} {current.label}</strong>
            <span>{current.hint}</span>
          </div>
        ) : (
          <div className="crowd__text">
            <strong>ยังไม่มีรายงาน</strong>
            <span>เป็นคนแรกที่ช่วยรายงานได้เลย</span>
          </div>
        )}
      </div>

      {summary?.total > 0 && (
        <p className="crowd__meta">
          จากรายงาน {summary.total} ครั้งใน {summary.windowMinutes} นาทีล่าสุด · ล่าสุด {timeAgo(summary.lastReportAt)}
        </p>
      )}

      <p className="crowd__ask">ตอนนี้บนรถเป็นยังไง?</p>
      <div className="crowd__buttons">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            className="crowd__btn"
            disabled={submitting}
            onClick={() => handleReport(l.value)}
          >
            <span>{l.icon}</span>
            <strong>{l.label}</strong>
          </button>
        ))}
      </div>

      {feedback && <p className="crowd__feedback">{feedback}</p>}
    </section>
  )
}
