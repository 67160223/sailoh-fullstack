import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import './ArrivalAlert.css'

const POLL_MS = 5 * 1000
const THRESHOLD_OPTIONS = [2, 3, 5] // นาที
const DEFAULT_THRESHOLD = 3
const REARM_MARGIN_MINS = 2 // รถต้องห่างเกิน threshold + ค่านี้ ถึงจะเตือนรอบใหม่ได้ (กันเตือนรัวตอน ETA แกว่ง)

// แจ้งเตือนผ่านระบบแจ้งเตือนของเบราว์เซอร์ — Android Chrome ห้ามเรียก new Notification() ตรง ๆ
// ต้องผ่าน service worker จึงลองทั้งสองทางตามลำดับ ถ้าไม่ได้เลยก็ยังมีแบนเนอร์ในหน้า + สั่นเครื่องเป็นตัวสำรอง
async function showBrowserNotification(title, body) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const options = { body, icon: '/icon-192.png', tag: 'arrival-alert' }
  try {
    new Notification(title, options)
  } catch {
    try {
      const reg = await navigator.serviceWorker?.ready
      await reg?.showNotification(title, options)
    } catch {
      // แจ้งเตือนระบบไม่ได้ ก็ใช้แบนเนอร์ในหน้าแทน
    }
  }
}

/**
 * ตั้งเตือนให้ "รถใกล้ถึงป้ายที่ฉันรอ" — เลือกป้าย + เลือกว่าให้เตือนเมื่อเหลืออีกกี่นาที
 * เช็ค ETA ของป้ายนั้นทุก 5 วินาที (ใช้ endpoint /eta เดิม) แล้วเตือนเมื่อ ETA <= เกณฑ์
 *
 * ข้อจำกัด: ทำงานตอนเปิดหน้านี้ค้างไว้เท่านั้น (ยังไม่ใช่ push notification จากเซิร์ฟเวอร์ที่เตือนได้แม้ปิดแอป)
 *
 * props:
 * - routeId: number
 * - routeNumber: string
 * - stops: [{ id, name, lat, lng }]  ป้ายที่ไม่มีพิกัดจะคำนวณ ETA ไม่ได้ จึงไม่แสดงให้เลือก
 */
export default function ArrivalAlert({ routeId, routeNumber, stops = [] }) {
  const { authFetch } = useAuth()
  const [alerts, setAlerts] = useLocalStorage('arrivalAlerts', {}) // { [routeId]: { stopId, threshold } }
  const watch = alerts[routeId] || null
  const selectableStops = stops.filter((s) => s.lat != null && s.lng != null)

  const [open, setOpen] = useState(false)
  const [selectedStop, setSelectedStop] = useState(selectableStops[0]?.id ?? '')
  const [selectedThreshold, setSelectedThreshold] = useState(DEFAULT_THRESHOLD)
  const [eta, setEta] = useState(null) // นาทีที่เหลือ หรือ null ถ้ายังไม่มีข้อมูลตำแหน่งรถ
  const [arrived, setArrived] = useState(false) // แสดงแบนเนอร์ "รถใกล้ถึงแล้ว"
  const [notifyHint, setNotifyHint] = useState('')
  const firedRef = useRef(false)

  const watchedStop = watch ? stops.find((s) => s.id === watch.stopId) : null

  // เช็ค ETA เป็นระยะ ตราบที่ตั้งเตือนไว้
  useEffect(() => {
    if (!watch || !watchedStop) return undefined
    let ignore = false
    firedRef.current = false
    setArrived(false)

    function fire(mins) {
      const title = `สาย ${routeNumber} ใกล้ถึงป้ายแล้ว`
      const body = `ป้าย ${watchedStop.name} — อีกประมาณ ${mins} นาที`
      setArrived(true)
      showBrowserNotification(title, body)
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        // อุปกรณ์ไม่รองรับการสั่น ก็ข้ามไป
      }
    }

    function check() {
      authFetch(`/routes/${routeId}/eta?stopId=${watch.stopId}`)
        .then((data) => {
          if (ignore) return
          setEta(data.etaMins)
          if (data.etaMins <= watch.threshold && !firedRef.current) {
            firedRef.current = true
            fire(data.etaMins)
          } else if (data.etaMins > watch.threshold + REARM_MARGIN_MINS) {
            firedRef.current = false // รถผ่านไปแล้ว/ยังไกลอยู่ — พร้อมเตือนรอบถัดไป
            setArrived(false)
          }
        })
        .catch(() => { if (!ignore) setEta(null) }) // ยังไม่มีตำแหน่งรถ ก็รอรอบถัดไป
    }

    check()
    const timer = setInterval(check, POLL_MS)
    return () => {
      ignore = true
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, routeNumber, watch?.stopId, watch?.threshold, authFetch])

  async function handleEnable(e) {
    e.preventDefault()
    if (!selectedStop) return
    setNotifyHint('')
    // ต้องขอสิทธิ์ตอนผู้ใช้กดปุ่มเท่านั้น (เบราว์เซอร์ไม่ยอมให้ขอเองเงียบ ๆ)
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // ขอสิทธิ์ไม่สำเร็จ ก็ใช้แบนเนอร์ในหน้าแทน
      }
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      setNotifyHint('ไม่ได้เปิดการแจ้งเตือนของเบราว์เซอร์ จะเตือนด้วยแบนเนอร์ในหน้านี้แทน (ต้องเปิดหน้านี้ค้างไว้)')
    }
    setAlerts((prev) => ({ ...prev, [routeId]: { stopId: Number(selectedStop), threshold: selectedThreshold } }))
    setOpen(false)
  }

  function handleCancel() {
    setAlerts((prev) => {
      const next = { ...prev }
      delete next[routeId]
      return next
    })
    setEta(null)
    setArrived(false)
  }

  if (selectableStops.length === 0) return null

  return (
    <section className="arrival-alert">
      {watch && watchedStop ? (
        <div className={`arrival-alert__active${arrived ? ' is-arrived' : ''}`}>
          <div className="arrival-alert__info">
            <strong>
              {arrived ? '🔔 รถใกล้ถึงแล้ว!' : '🔔 กำลังเฝ้าป้าย'} {watchedStop.name}
            </strong>
            <span>
              {eta == null
                ? 'ยังไม่มีข้อมูลตำแหน่งรถ'
                : `รถจะถึงในอีกประมาณ ${eta} นาที · เตือนเมื่อเหลือ ${watch.threshold} นาที`}
            </span>
          </div>
          <button type="button" className="arrival-alert__stop" onClick={handleCancel}>
            ยกเลิก
          </button>
        </div>
      ) : !open ? (
        <button type="button" className="arrival-alert__cta" onClick={() => setOpen(true)}>
          🔔 เตือนเมื่อรถใกล้ถึงป้าย
        </button>
      ) : (
        <form className="arrival-alert__form" onSubmit={handleEnable}>
          <label className="arrival-alert__field">
            ป้ายที่รอ
            <select value={selectedStop} onChange={(e) => setSelectedStop(e.target.value)} required>
              {selectableStops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="arrival-alert__field">
            เตือนเมื่อรถเหลืออีก
            <div className="arrival-alert__options" role="radiogroup" aria-label="เวลาที่ให้เตือน">
              {THRESHOLD_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`arrival-alert__option${selectedThreshold === mins ? ' is-active' : ''}`}
                  onClick={() => setSelectedThreshold(mins)}
                >
                  {mins} นาที
                </button>
              ))}
            </div>
          </div>

          <div className="arrival-alert__actions">
            <button type="submit" className="arrival-alert__submit">
              เปิดการแจ้งเตือน
            </button>
            <button type="button" className="arrival-alert__cancel" onClick={() => setOpen(false)}>
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {notifyHint && <p className="arrival-alert__hint">{notifyHint}</p>}
    </section>
  )
}
