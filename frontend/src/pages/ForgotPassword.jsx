import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import './Auth.css'

// ลืมรหัสผ่าน — ยืนยันตัวตนด้วย username + email ที่ตรงกับบัญชี แล้วตั้งรหัสผ่านใหม่ได้เลย
// (โปรเจกต์นี้ไม่มีระบบส่งอีเมลจริง จึงเก็บ resetToken ไว้ในสเตปเดียวกันแทนการส่งอีเมล
//  ของจริงต้องแยกเป็นลิงก์ที่ส่งทางอีเมลเท่านั้น ห้ามให้ผู้ใช้เห็น token ตรง ๆ)
export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState('verify') // 'verify' | 'reset'
  const [resetToken, setResetToken] = useState('')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { username: username.trim(), email: email.trim() },
      })
      setResetToken(result.resetToken)
      setStep('reset')
    } catch (err) {
      setError(err.message || 'ยืนยันตัวตนไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน')
      return
    }

    setLoading(true)
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: { resetToken, newPassword } })
      navigate('/login', { replace: true, state: { message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบใหม่' } })
    } catch (err) {
      setError(err.message || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ')
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
            <h1>ลืมรหัสผ่าน</h1>
          </div>
        </div>

        {step === 'verify' && (
          <form className="auth-form" onSubmit={handleVerify}>
            <p className="auth-hint">กรอกชื่อผู้ใช้และอีเมลที่ใช้สมัครไว้ เพื่อยืนยันว่าเป็นเจ้าของบัญชีจริง</p>
            {error && <p className="auth-error">{error}</p>}

            <label>
              ชื่อผู้ใช้
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
            </label>
            <label>
              อีเมลที่ใช้สมัคร
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันตัวตน'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form className="auth-form" onSubmit={handleReset}>
            <p className="auth-hint auth-hint--ok">ยืนยันตัวตนสำเร็จ — ตั้งรหัสผ่านใหม่ได้เลย</p>
            {error && <p className="auth-error">{error}</p>}

            <label>
              รหัสผ่านใหม่
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                autoFocus
                required
              />
            </label>
            <label>
              ยืนยันรหัสผ่านใหม่
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'กำลังตั้งรหัสผ่านใหม่...' : 'ตั้งรหัสผ่านใหม่'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">← กลับไปเข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
