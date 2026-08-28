import { Link } from 'react-router-dom'
import RoutePlate from '../constants/components/RoutePlate'
import { useFavorites } from '../context/FavoritesContext'
import './Saved.css'

export default function Saved() {
  const { favorites, loaded } = useFavorites()

  return (
    <div className="page saved">
      <header>
        <p className="eyebrow">บันทึกไว้</p>
        <h1>สายที่ติดตามอยู่</h1>
      </header>

      {!loaded && <p className="empty-state">กำลังโหลด...</p>}

      {loaded && favorites.length === 0 && (
        <p className="empty-state">
          ยังไม่มีสายที่บันทึกไว้ — เปิดสายที่ใช้บ่อยแล้วกด "บันทึกสายนี้"
          <br />ครั้งหน้าจะเจอที่นี่ทันที ไม่ต้องพิมพ์ค้นหาใหม่
        </p>
      )}

      {loaded && favorites.length > 0 && (
        <ul className="saved__list">
          {favorites.map((r) => (
            <li key={r.id}>
              <Link to={`/route/${r.id}`} className="saved__item">
                <RoutePlate route={r} />
                <div className="saved__text">
                  <strong>สาย {r.number}</strong>
                  <span>{r.name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
