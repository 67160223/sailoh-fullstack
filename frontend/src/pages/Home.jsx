import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../constants/components/SearchBar'
import RoutePlate from '../constants/components/RoutePlate'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from '../context/AuthContext'
import { STATUS_COPY } from '../constants/plateTypes'
import './Home.css'

// Stage 1 (ตอนอยู่บ้าน/กำลังเดินไปป้าย): เปิดมาต้องเจอช่องค้นหาทันที ไม่มีอะไรกั้น
// Stage 2 (ถึงป้ายแล้ว): ถ้าเคยดูสายไหนมาก่อน ให้กดซ้ำได้เลยไม่ต้องพิมพ์ใหม่
export default function Home() {
  const { authFetch } = useAuth()
  const [recent] = useLocalStorage('recentRoutes', [])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    authFetch('/routes?limit=20')
      .then((res) => { if (!ignore) setRoutes(res.items) })
      .catch((err) => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [authFetch])

  return (
    <div className="page home">
      <header className="home__header">
        <p className="eyebrow">สายเลข</p>
        <h1>รถเมล์สายไหนอยู่ตรงไหนแล้ว</h1>
        <p className="home__sub">พิมพ์เลขสายเดียว ไม่ต้องเปิดแอปหนัก ๆ</p>
      </header>

      <SearchBar autoFocus />

      {recent.length > 0 && (
        <section className="home__section">
          <p className="eyebrow">ดูล่าสุด</p>
          <div className="home__chip-row">
            {recent.map((r) => (
              <Link key={r.id} to={`/route/${r.id}`} className="home__chip">
                <RoutePlate route={r} size="sm" />
                <span>{r.number}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home__section">
        <p className="eyebrow">สายทั้งหมด</p>

        {loading && <p className="empty-state">กำลังโหลดสายรถเมล์...</p>}
        {!loading && error && <p className="empty-state">โหลดไม่สำเร็จ: {error}</p>}
        {!loading && !error && routes.length === 0 && (
          <p className="empty-state">ยังไม่มีสายรถเมล์ในระบบ</p>
        )}

        <ul className="home__list">
          {routes.map((r) => {
            const statusInfo = STATUS_COPY[r.location?.status?.toLowerCase()]
            return (
              <li key={r.id}>
                <Link to={`/route/${r.id}`} className="home__list-item">
                  <RoutePlate route={r} />
                  <div className="home__list-text">
                    <strong>สาย {r.number}</strong>
                    <span>{r.name}</span>
                  </div>
                  <span className="home__list-status">{statusInfo ? statusInfo.label : 'ยังไม่มีตำแหน่ง'}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
