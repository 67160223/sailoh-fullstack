import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// หน้าที่ต้อง login ก่อนถึงเข้าได้ — ยังไม่ login เด้งไปหน้า /login พร้อมจำหน้าที่ตั้งใจจะไปไว้ด้วย
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
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

// หน้าแอดมิน — ต้อง login และต้องเป็น role ADMIN เท่านั้น ไม่ใช่ทั้งสองอย่างเด้งกลับหน้าหลัก
export function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }
  return children
}
