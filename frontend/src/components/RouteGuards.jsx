import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './RouteGuards.css'

// แทนที่จะเด้งไปหน้า /login ตรงๆ — โชว์ข้อความเตือนในหน้านั้นเลย แล้วให้กดไปหน้าตั้งค่า
// (เข้าสู่ระบบย้ายไปรวมอยู่ในหน้าตั้งค่าแทน ไม่มีการบังคับเด้งหน้าอีกต่อไป)
function LoginRequired({ message }) {
  return (
    <div className="page route-guard">
      <p className="empty-state">
        {message || 'หน้านี้ต้องเข้าสู่ระบบก่อนใช้งาน'}
        <br />
        กดปุ่ม ⚙️ ที่มุมบนขวาแล้วเข้าสู่ระบบที่หน้าตั้งค่าได้เลย
      </p>
      <Link to="/settings" className="route-guard__btn">
        ⚙️ ไปหน้าตั้งค่า
      </Link>
    </div>
  )
}

// หน้าที่ต้อง login ก่อนถึงเข้าได้ — ยังไม่ login ไม่เด้งไปไหน แค่โชว์ข้อความในหน้านั้นเลย
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginRequired />
  }
  return children
}

// หน้า login/register — ถ้า login อยู่แล้วไม่ต้องเห็นหน้านี้อีก เด้งเข้าระบบเลย
export function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

// หน้าแอดมิน — ต้อง login และต้องเป็น role ADMIN เท่านั้น ไม่งั้นโชว์ข้อความแทนการเด้งหน้า
export function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <LoginRequired message="หน้านี้สำหรับผู้ดูแลระบบ ต้องเข้าสู่ระบบก่อนใช้งาน" />
  }
  if (user?.role !== 'ADMIN') {
    return (
      <div className="page route-guard">
        <p className="empty-state">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น บัญชีนี้ไม่มีสิทธิ์เข้าถึง</p>
        <Link to="/" className="route-guard__btn">← กลับหน้าหลัก</Link>
      </div>
    )
  }
  return children
}
