import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import RoutePlate from '../constants/components/RoutePlate'
import ETABadge from '../constants/components/ETABadge'
import ShareButton from '../constants/components/ShareButton'
import RouteMap from '../constants/components/RouteMap'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import './RouteDetail.css'

const STATUS_TEXT = {
  MOVING: 'กำลังวิ่งมาตามเวลา',
  DELAYED: 'รถติด มาช้ากว่าปกติเล็กน้อย',
  LAST: 'เที่ยวนี้เป็นคันสุดท้ายของวัน',
}

export default function RouteDetail() {
  const { id } = useParams()
  const routeId = Number(id)
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const { authFetch, isAuthenticated } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [, setRecent] = useLocalStorage('recentRoutes', [])

  const [route, setRoute] = useState(null)
  const [location, setLocation] = useState(null)
  const [eta, setEta] = useState(null)
  const [view, setView] = useState('list') // list ประหยัดดาต้ากว่า จึงเป็นค่าเริ่มต้น
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    authFetch(`/routes/${routeId}`)
      .then((data) => {
        if (ignore) return
        setRoute(data)
        setRecent((prev) => [data, ...prev.filter((r) => r.id !== data.id)].slice(0, 6))
      })
      .catch((err) => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  useEffect(() => {
    let ignore = false
    authFetch(`/routes/${routeId}/location`)
      .then((data) => { if (!ignore) setLocation(data) })
      .catch(() => { if (!ignore) setLocation(null) }) // ยังไม่มีตำแหน่ง GPS โพสต์เข้ามา ก็แสดงผลแบบไม่มีตำแหน่งได้
    return () => { ignore = true }
  }, [routeId, authFetch])

  useEffect(() => {
    if (!location?.nextStopId) { setEta(null); return }
    let ignore = false
    authFetch(`/routes/${routeId}/eta?stopId=${location.nextStopId}`)
      .then((data) => { if (!ignore) setEta(data) })
      .catch(() => { if (!ignore) setEta(null) })
    return () => { ignore = true }
  }, [routeId, location, authFetch])

  if (loading) return <div className="page route-detail"><p className="empty-state">กำลังโหลด...</p></div>
  if (error || !route) {
    return (
      <div className="page route-detail">
        <Link to="/" className="route-detail__back">← กลับ</Link>
        <p className="empty-state">{error || 'ไม่พบสายรถเมล์นี้'}</p>
      </div>
    )
  }

  const nextStop = route.stops.find((s) => s.id === location?.nextStopId)
  const saved = isFavorite(route.id)

  async function handleToggleSave() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: routerLocation } })
      return
    }
    setSaving(true)
    try {
      await toggleFavorite(route)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page route-detail">
      <Link to="/" className="route-detail__back">← กลับ</Link>

      <header className="route-detail__header">
        <RoutePlate route={route} size="lg" status={location?.status} />
        <div>
          <h1>สาย {route.number}</h1>
          <p className="route-detail__name">{route.name}</p>
        </div>
      </header>

      {location ? (
        <div className="route-detail__status">{STATUS_TEXT[location.status] || 'กำลังวิ่งอยู่'}</div>
      ) : (
        <div className="route-detail__status">ยังไม่มีข้อมูลตำแหน่งรถขณะนี้</div>
      )}

      {location && (
        <div className="route-detail__eta-row">
          {eta ? (
            <ETABadge mins={eta.etaMins} status={location.status?.toLowerCase()} />
          ) : (
            <p className="route-detail__next-only">ยังคำนวณเวลาถึงไม่ได้ (ป้ายถัดไปยังไม่มีพิกัด)</p>
          )}
          {nextStop && (
            <p className="route-detail__next">
              ป้ายถัดไป <strong>{nextStop.name}</strong>
            </p>
          )}
        </div>
      )}

      <div className="route-detail__toggle" role="tablist" aria-label="รูปแบบการแสดงผล">
        <button
          role="tab"
          aria-selected={view === 'list'}
          className={view === 'list' ? 'is-active' : ''}
          onClick={() => setView('list')}
        >
          รายการป้าย
        </button>
        <button
          role="tab"
          aria-selected={view === 'map'}
          className={view === 'map' ? 'is-active' : ''}
          onClick={() => setView('map')}
        >
          แผนที่
        </button>
      </div>

      {view === 'list' ? (
        <ol className="route-detail__stops">
          {route.stops.map((stop) => (
            <li key={stop.id} className={stop.id === location?.nextStopId ? 'is-next' : ''}>
              <span className="route-detail__stop-dot" />
              {stop.name}
            </li>
          ))}
        </ol>
      ) : (
        <div className="route-detail__map-wrap">
          <RouteMap
            stops={route.stops}
            busPosition={location ? { lat: location.lat, lng: location.lng, status: location.status } : null}
            nextStopId={location?.nextStopId}
            height={300}
          />
        </div>
      )}

      <div className="route-detail__actions">
        <button className={`route-detail__save${saved ? ' is-saved' : ''}`} onClick={handleToggleSave} disabled={saving}>
          {!isAuthenticated ? '📌 เข้าสู่ระบบเพื่อบันทึก' : saved ? '📌 บันทึกไว้แล้ว' : '📌 บันทึกสายนี้'}
        </button>
        <ShareButton route={route} />
      </div>
    </div>
  )
}
