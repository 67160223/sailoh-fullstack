import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'available' | 'taken'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  // เช็คว่า username ซ้ำไหมระหว่างพิมพ์ — ใช้ endpoint check-username ของจริง
  useEffect(() => {
    const trimmed = username.trim()
    if (trimmed.length < 3) {
      setUsernameStatus(null)
      return
    }
    setUsernameStatus('checking')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await apiFetch(`/users/check-username/${encodeURIComponent(trimmed)}`)
        setUsernameStatus(result.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus(null)
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [username])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (usernameStatus === 'taken') {
      setError('username นี้มีคนใช้แล้ว')
      return
    }

    setLoading(true)
    try {
      await register({ username: username.trim(), email: email.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__plate">140</span>
          <div>
            <p className="eyebrow">สายเลข</p>
            <h1>สมัครสมาชิก</h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}

          <label>
            ชื่อผู้ใช้
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
            />
          </label>
          {usernameStatus === 'checking' && <p className="auth-hint">กำลังตรวจสอบ...</p>}
          {usernameStatus === 'available' && <p className="auth-hint auth-hint--ok">username นี้ใช้ได้</p>}
          {usernameStatus === 'taken' && <p className="auth-hint auth-hint--taken">username นี้มีคนใช้แล้ว</p>}

          <label>
            อีเมล
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            รหัสผ่าน
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loading || usernameStatus === 'taken'}>
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="auth-switch">
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
