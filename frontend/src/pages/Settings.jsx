import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import './Settings.css'

// หน้าตั้งค่า — เป็นการตั้งค่าเครื่อง/เบราว์เซอร์ ไม่ผูกกับบัญชี จึงเปิดให้ guest ใช้ได้ด้วย
export default function Settings() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="page settings">
      <Link to="/" className="settings__back">← กลับ</Link>

      <header className="settings__header">
        <p className="eyebrow">การตั้งค่า</p>
        <h1>ตั้งค่า</h1>
      </header>

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
