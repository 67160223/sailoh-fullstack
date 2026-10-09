import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import './Settings.css'

// หน้าตั้งค่า — รวมทั้งการตั้งค่าเครื่อง/เบราว์เซอร์ (ธีม) ที่ไม่ผูกกับบัญชี
// และเป็นทางเข้าเดียวสำหรับเข้าสู่ระบบ/จัดการบัญชี (ย้ายมาจากปุ่ม "เข้าระบบ" ที่ TopBar เดิม)
export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="page settings">
      <Link to="/" className="settings__back">← กลับ</Link>

      <header className="settings__header">
        <p className="eyebrow">การตั้งค่า</p>
        <h1>ตั้งค่า</h1>
      </header>

      <section className="settings__card">
        <p className="settings__card-title">บัญชีผู้ใช้</p>

        {isAuthenticated ? (
          <>
            <p className="settings__card-desc">
              เข้าสู่ระบบด้วยบัญชี <strong>{user?.displayName || user?.username}</strong>
            </p>
            <div className="settings__account-actions">
              <Link to="/profile" className="settings__account-btn">
                👤 ไปที่โปรไฟล์ของฉัน
              </Link>
              <button type="button" className="settings__logout-btn" onClick={logout}>
                ออกจากระบบ
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="settings__card-desc">เข้าสู่ระบบเพื่อบันทึกสายที่ใช้บ่อย ดูโปรไฟล์ และฟีเจอร์อื่นที่ต้องมีบัญชี</p>
            <div className="settings__account-actions">
              <Link to="/login" className="settings__account-btn" state={{ from: location }}>
                เข้าสู่ระบบ
              </Link>
              <Link to="/register" className="settings__register-link">
                สมัครสมาชิก
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="settings__card">
        <p className="settings__card-title">ธีมของแอป</p>
        <p className="settings__card-desc">เลือกโหมดสว่างหรือมืด — จำค่าไว้ในเครื่องนี้ ไม่ต้องตั้งใหม่ทุกครั้ง</p>

        <div className="settings__theme-toggle" role="radiogroup" aria-label="เลือกธีม">
          <button
            role="radio"
            aria-checked={theme === 'dark'}
            className={theme === 'dark' ? 'is-active' : ''}
            onClick={() => setTheme('dark')}
          >
            🌙 มืด
          </button>
          <button
            role="radio"
            aria-checked={theme === 'light'}
            className={theme === 'light' ? 'is-active' : ''}
            onClick={() => setTheme('light')}
          >
            ☀️ สว่าง
          </button>
        </div>
      </section>
    </div>
  )
}
