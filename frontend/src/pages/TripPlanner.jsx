import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RoutePlate from '../components/RoutePlate'
import { useAuth } from '../context/AuthContext'
import './TripPlanner.css'

const DIRECTION_LABEL = { FORWARD: 'ขาไป', REVERSE: 'ขากลับ' }

/**
 * วางแผนเดินทางแบบนั่งสายเดียว — พิมพ์ป้ายต้นทางกับปลายทาง แล้วระบบหาสายที่ผ่านทั้งสองป้ายให้
 * พิมพ์ชื่อบางส่วนได้ (เช่น "หมอชิต") และมีรายชื่อป้ายให้เลือกช่วยพิมพ์
 * ยังไม่รองรับการต่อรถหลายสาย
 */
export default function TripPlanner() {
  const { authFetch } = useAuth()
  const [stopNames, setStopNames] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [plans, setPlans] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    let ignore = false
    authFetch('/trips/stops')
      .then((names) => { if (!ignore) setStopNames(names) })
      .catch(() => {}) // ไม่มีรายชื่อช่วยพิมพ์ ก็ยังพิมพ์เองได้
    return () => { ignore = true }
  }, [authFetch])

  async function handleSearch(e) {
    e.preventDefault()
    const f = from.trim()
    const t = to.trim()
    if (!f || !t) return
    setState('loading')
    setMessage('')
    try {
      const data = await authFetch(`/trips/plan?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`)
      setPlans(data)
      setState('done')
    } catch (err) {
      setMessage(err.message || 'วางแผนเดินทางไม่สำเร็จ ลองใหม่อีกครั้ง')
      setState('error')
    }
  }

  function handleSwap() {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="page trip">
      <header className="trip__header">
        <p className="eyebrow">วางแผนเดินทาง</p>
        <h1>จะไปไหน นั่งสายอะไรดี</h1>
        <p className="trip__sub">พิมพ์ป้ายต้นทางกับปลายทาง ระบบหาสายที่ไปถึงโดยไม่ต้องต่อรถให้</p>
      </header>

      <form className="trip__form" onSubmit={handleSearch}>
        <div className="trip__fields">
          <label className="trip__field">
            <span>ต้นทาง</span>
            <input
              type="text"
              list="trip-stop-names"
              placeholder="พิมพ์ชื่อป้ายต้นทาง"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </label>

          <button type="button" className="trip__swap" onClick={handleSwap} aria-label="สลับต้นทางกับปลายทาง">
            ⇅
          </button>

          <label className="trip__field">
            <span>ปลายทาง</span>
            <input
              type="text"
              list="trip-stop-names"
              placeholder="พิมพ์ชื่อป้ายปลายทาง"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </label>
        </div>

        <datalist id="trip-stop-names">
          {stopNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <button type="submit" className="trip__submit" disabled={state === 'loading'}>
          {state === 'loading' ? 'กำลังหาสาย...' : '🧭 หาสายรถเมล์'}
        </button>
      </form>

      {state === 'error' && <p className="trip__msg">{message}</p>}

      {state === 'done' && plans.length === 0 && (
        <p className="trip__msg">
          ไม่พบสายที่ผ่านทั้งสองป้ายโดยตรง ลองพิมพ์ชื่อป้ายให้สั้นลง หรือเลือกจากรายชื่อที่ขึ้นมาช่วย
          (ตอนนี้ยังไม่รองรับการต่อรถหลายสาย)
        </p>
      )}

      {plans.length > 0 && (
        <ul className="trip__list">
          {plans.map((p) => (
            <li key={p.route.id}>
              <Link to={`/route/${p.route.id}`} className="trip__card">
                <div className="trip__card-top">
                  <RoutePlate route={p.route} size="sm" />
                  <div className="trip__card-title">
                    <strong>สาย {p.route.number}</strong>
                    <span>{DIRECTION_LABEL[p.direction]} · {p.route.name}</span>
                  </div>
                  <div className="trip__fare">
                    <strong>{p.fare}</strong>
                    <span>บาท</span>
                  </div>
                </div>

                <p className="trip__path">
                  ขึ้นที่ <strong>{p.fromStop.name}</strong> → ลงที่ <strong>{p.toStop.name}</strong>
                </p>

                <p className="trip__meta">
                  {p.stopsCount} ป้าย · ประมาณ {p.rideMins} นาที · {p.distanceKm} กม.
                </p>

                {p.busEtaMins != null && (
                  <p className="trip__bus">🚌 รถที่กำลังวิ่งจะถึงป้ายต้นทางในอีกประมาณ {p.busEtaMins} นาที</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {state === 'done' && plans.length > 0 && (
        <p className="trip__note">เวลาที่แสดงเป็นค่าประมาณจากระยะทางและความเร็วเฉลี่ยของรถเมล์ในเมือง</p>
      )}
    </div>
  )
}
