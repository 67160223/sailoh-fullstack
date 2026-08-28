import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'
import './Profile.css'
import './Admin.css'

const ROLE_LABEL = { ADMIN: 'แอดมิน', USER: 'ผู้ใช้ทั่วไป' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}

// แอดมินกดคลิกดูรายละเอียดของสมาชิกคนที่เลือกจากตาราง — ดึงด้วย GET /users/:id
export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authFetch, user: currentUser, updateStoredUser, logout } = useAuth()

  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('USER')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveErr, setSaveErr] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isSelf = currentUser?.id === Number(id)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setLoadError('')

    authFetch(`/users/${id}`)
      .then((data) => {
        if (ignore) return
        setTarget(data)
        setDisplayName(data.displayName || '')
        setEmail(data.email || '')
        setRole(data.role)
      })
      .catch((err) => { if (!ignore) setLoadError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })

    return () => { ignore = true }
  }, [authFetch, id])

  async function handleSave(e) {
    e.preventDefault()
    setSaveErr('')
    setSaveMsg('')
    setSaving(true)
    try {
      const updated = await authFetch(`/users/${id}`, {
        method: 'PUT',
        body: { displayName, email, role },
      })
      setTarget(updated)
      // ถ้าแอดมินแก้ไขข้อมูลของตัวเอง ให้อัปเดต context ด้วย จะได้เห็น TopBar/Profile ตรงกันทันที
      if (isSelf) updateStoredUser({ displayName: updated.displayName, email: updated.email, role: updated.role })
      setSaveMsg('บันทึกสำเร็จ')
    } catch (err) {
      setSaveErr(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!target) return
    if (!window.confirm(`ลบผู้ใช้ "${target.username}" ออกจากระบบ? การกระทำนี้ย้อนกลับไม่ได้`)) return

    setDeleting(true)
    try {
      await authFetch(`/users/${id}`, { method: 'DELETE' })
      if (isSelf) {
        // ลบบัญชีตัวเอง — ต้อง logout ทันทีเพราะ session ใช้ต่อไม่ได้แล้ว
        await logout()
        navigate('/login', { replace: true })
      } else {
        navigate('/admin/users', { replace: true })
      }
    } catch (err) {
      alert(err.message || 'ลบไม่สำเร็จ')
      setDeleting(false)
    }
  }

  if (loading) return <div className="page admin"><p className="empty-state">กำลังโหลด...</p></div>

  return (
    <div className="page admin">
      <Link to="/admin/users" className="profile__back">← กลับไปรายชื่อผู้ใช้</Link>

      <header className="profile__header">
        <p className="eyebrow">Admin Dashboard</p>
        <h1>รายละเอียดผู้ใช้ #{id}</h1>
      </header>

      {loadError && <p className="empty-state">โหลดไม่สำเร็จ: {loadError}</p>}

      {target && (
        <>
          <section className="profile__card">
            <div className="profile__readonly-row">
              <span>ชื่อผู้ใช้</span>
              <strong>{target.username}{isSelf && <span className="admin__you-tag">คุณ</span>}</strong>
            </div>
            <div className="profile__readonly-row">
              <span>บทบาทปัจจุบัน</span>
              <strong>{ROLE_LABEL[target.role] || target.role}</strong>
            </div>
            <div className="profile__readonly-row">
              <span>เป็นสมาชิกตั้งแต่</span>
              <strong>{formatDate(target.createdAt)}</strong>
            </div>
          </section>

          <form className="profile__card profile__form" onSubmit={handleSave}>
            <p className="profile__card-title">แก้ไขข้อมูล</p>

            {saveErr && <p className="auth-error">{saveErr}</p>}
            {saveMsg && <p className="profile__success">{saveMsg}</p>}

            <label>
              ชื่อที่แสดง
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
            </label>

            <label>
              อีเมล
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label>
              บทบาท (Role)
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="USER">ผู้ใช้ทั่วไป (USER)</option>
                <option value="ADMIN">แอดมิน (ADMIN)</option>
              </select>
            </label>
            {isSelf && role !== target.role && (
              <p className="auth-hint">กำลังเปลี่ยน role ของตัวเอง — ถ้าลด role ตัวเองอาจเข้าหน้านี้ไม่ได้อีก</p>
            )}

            <button className="auth-submit" type="submit" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </form>

          <button className="profile__logout" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'กำลังลบ...' : '🗑️ ลบผู้ใช้นี้'}
          </button>
        </>
      )}
    </div>
  )
}
