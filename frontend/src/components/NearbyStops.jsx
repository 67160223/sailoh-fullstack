import { useState } from 'react'
import { Link } from 'react-router-dom'
import RoutePlate from './RoutePlate'
import { useAuth } from '../context/AuthContext'
import './NearbyStops.css'

// ตำแหน่งตัวอย่าง (อนุสาวรีย์ชัยสมรภูมิ) — ไว้ลองฟีเจอร์ตอนผู้ใช้อยู่นอกพื้นที่ที่มีข้อมูลสายในระบบ
// หรือตอนเดโมให้อาจารย์ดูโดยไม่ต้องไปยืนอยู่ในกรุงเทพฯ จริง
const SAMPLE_POSITION = { lat: 13.7649, lng: 100.5383, label: 'อนุสาวรีย์ชัยสมรภูมิ' }

const FAR_KM = 20 // ไกลกว่านี้ถือว่าอยู่นอกพื้นที่ที่ระบบมีข้อมูล

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} ม.`
  return `${km.toFixed(1)} กม.`
}

function geolocationMessage(err) {
  if (err.code === 1) return 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง — เปิดสิทธิ์ตำแหน่งของเบราว์เซอร์แล้วลองใหม่'
  if (err.code === 2) return 'หาตำแหน่งของคุณไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง'
  if (err.code === 3) return 'หาตำแหน่งนานเกินไป ลองใหม่อีกครั้ง'
  return 'หาตำแหน่งของคุณไม่สำเร็จ'
}

/**
 * ป้ายและสายที่ใกล้ตำแหน่งผู้ใช้ที่สุด — ตอบ Stage 1 ของแอป (กำลังเดินไปป้าย: "ใกล้ฉันมีสายอะไรบ้าง")
 * ใช้ Geolocation API ของเบราว์เซอร์ (ต้องเป็น https หรือ localhost เท่านั้น)
 */
export default function NearbyStops() {
  const { authFetch } = useAuth()
  const [state, setState] = useState('idle') // idle | locating | loading | done | error
  const [results, setResults] = useState([])
  const [origin, setOrigin] = useState(null) // { label? } ใช้บอกว่าอ้างอิงจากตำแหน่งจริงหรือตัวอย่าง
  const [message, setMessage] = useState('')

  async function fetchNearby(lat, lng, label) {
    setState('loading')
    try {
      const data = await authFetch(`/stops/nearby?lat=${lat}&lng=${lng}&limit=5`)
      setResults(data)
      setOrigin({ label })
      setState('done')
    } catch (err) {
      setMessage(err.message || 'โหลดป้ายใกล้เคียงไม่สำเร็จ')
      setState('error')
    }
  }

  function handleLocate() {
    setMessage('')
    if (!navigator.geolocation) {
      setMessage('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง')
      setState('error')
      return
    }
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude, null),
      (err) => {
        setMessage(geolocationMessage(err))
        setState('error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  const busy = state === 'locating' || state === 'loading'
  const nearest = results[0]
  const tooFar = nearest && nearest.distanceKm > FAR_KM

  return (
    <section className="nearby" aria-label="ป้ายใกล้ฉัน">
      <button type="button" className="nearby__cta" onClick={handleLocate} disabled={busy}>
        {state === 'locating' ? '📍 กำลังหาตำแหน่งของคุณ...' : state === 'loading' ? '📍 กำลังหาป้ายใกล้เคียง...' : '📍 ป้ายใกล้ฉัน'}
      </button>

      {state === 'error' && <p className="nearby__msg">{message}</p>}

      {state === 'done' && (
        <>
          {origin?.label && <p className="nearby__origin">อ้างอิงจากตำแหน่งตัวอย่าง: {origin.label}</p>}

          {results.length === 0 && <p className="nearby__msg">ยังไม่มีป้ายที่มีพิกัดในระบบ</p>}

          {tooFar && (
            <p className="nearby__msg">
              ตำแหน่งของคุณอยู่ไกลจากป้ายที่มีในระบบ (ใกล้สุด {formatDistance(nearest.distanceKm)}) — ตอนนี้ระบบมีข้อมูลเฉพาะบางสายในกรุงเทพฯ
            </p>
          )}

          <ul className="nearby__list">
            {results.map((r) => (
              <li key={r.route.id}>
                <Link to={`/route/${r.route.id}`} className="nearby__item">
                  <RoutePlate route={r.route} size="sm" />
                  <div className="nearby__text">
                    <strong>สาย {r.route.number}</strong>
                    <span>ป้าย {r.stopName}</span>
                  </div>
                  <div className="nearby__dist">
                    <strong>{formatDistance(r.distanceKm)}</strong>
                    <span>เดิน ~{r.walkMins} นาที</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {!busy && (
        <button
          type="button"
          className="nearby__sample"
          onClick={() => fetchNearby(SAMPLE_POSITION.lat, SAMPLE_POSITION.lng, SAMPLE_POSITION.label)}
        >
          ลองใช้ตำแหน่งตัวอย่าง ({SAMPLE_POSITION.label})
        </button>
      )}
    </section>
  )
}
