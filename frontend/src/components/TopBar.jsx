import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './TopBar.css'

// มุมขวาบนทุกหน้า: ปุ่มเดียวเท่านั้น ไม่ว่าจะ login หรือไม่ก็ตาม
// ยังไม่ login → ฟันเฟือง ⚙️ ไปหน้าตั้งค่า/เข้าสู่ระบบ
// login แล้ว → avatar ไปหน้าโปรไฟล์ (ส่วนตั้งค่า/ธีม เข้าได้จากหน้าโปรไฟล์อีกทีหนึ่ง)
export default function TopBar() {
  const { user, isAuthenticated } = useAuth()

  return (
    <header className="top-bar">
      <Link to="/" className="top-bar__brand">สายเลข</Link>

      <div className="top-bar__right">
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
          <Link to="/settings" className="top-bar__settings-btn" title="ตั้งค่า / เข้าสู่ระบบ" aria-label="ตั้งค่า">
            ⚙️
          </Link>
        )}
      </div>
    </header>
  )
}
