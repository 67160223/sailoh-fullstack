import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './TopBar.css'

// มุมขวาบนทุกหน้า: ปุ่มตั้งค่าใช้ได้ทุกคน, ต่อด้วย "เข้าระบบ" (guest) หรือ avatar ไปหน้าโปรไฟล์ (login แล้ว)
export default function TopBar() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  return (
    <header className="top-bar">
      <Link to="/" className="top-bar__brand">สายเลข</Link>

      <div className="top-bar__right">
        <Link to="/settings" className="top-bar__settings-btn" title="ตั้งค่า" aria-label="ตั้งค่า">
          ⚙️
        </Link>

        {isAuthenticated ? (
          <Link
            to="/profile"
            className="top-bar__avatar"
            title={`โปรไฟล์ของ ${user?.displayName || user?.username}`}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="top-bar__avatar-img" />
            ) : (
              (user?.displayName || user?.username || '?').trim().charAt(0).toUpperCase()
            )}
          </Link>
        ) : (
          <Link to="/login" className="top-bar__login-btn" state={{ from: location }}>
            เข้าระบบ
          </Link>
        )}
      </div>
    </header>
  )
}
