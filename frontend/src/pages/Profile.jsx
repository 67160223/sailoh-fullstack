import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resizeImageToDataUrl } from '../lib/resizeImage'
import './Auth.css'
import './Profile.css'

const ROLE_LABEL = { ADMIN: 'ผู้ดูแลระบบ', USER: 'ผู้ใช้ทั่วไป' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Profile() {
  const { authFetch, updateStoredUser, changePassword, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // ฟอร์มแก้ไขข้อมูลส่วนตัว
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')

  // เปลี่ยนรูปโปรไฟล์
  const fileInputRef = useRef(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarErr, setAvatarErr] = useState('')

  // ฟอร์มเปลี่ยนรหัสผ่าน
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordErr, setPasswordErr] = useState('')

  // ดึงข้อมูลโปรไฟล์ผู้ใช้ที่กำลัง login อยู่ปัจจุบัน — GET /users/me
  useEffect(() => {
    let ignore = false
    authFetch('/users/me')
      .then((data) => {
        if (ignore) return
        setProfile(data)
        setDisplayName(data.displayName || '')
        setEmail(data.email || '')
      })
      .catch((err) => { if (!ignore) setLoadError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [authFetch])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileErr('')
    setProfileMsg('')
    setSavingProfile(true)
    try {
      const updated = await authFetch(`/users/${profile.id}`, {
        method: 'PUT',
        body: { displayName, email },
      })
      setProfile(updated)
      updateStoredUser({ displayName: updated.displayName, email: updated.email })
      setProfileMsg('บันทึกข้อมูลสำเร็จ')
    } catch (err) {
      setProfileErr(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordErr('')

    if (newPassword !== confirmPassword) {
      setPasswordErr('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน')
      return
    }

    setChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      // backend เพิกถอน refresh token ทั้งหมดตอนเปลี่ยนรหัสผ่านสำเร็จ — ต้อง login ใหม่เสมอ
      navigate('/login', { replace: true, state: { message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่' } })
    } catch (err) {
      setPasswordErr(err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
      setChangingPassword(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // เคลียร์ input ไว้ เผื่อผู้ใช้อยากเลือกไฟล์เดิมซ้ำอีกครั้ง
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarErr('เลือกได้แค่ไฟล์รูปภาพเท่านั้น')
      return
    }

    setAvatarErr('')
    setUploadingAvatar(true)
    try {
      const avatarUrl = await resizeImageToDataUrl(file)
      const updated = await authFetch(`/users/${profile.id}`, { method: 'PUT', body: { avatarUrl } })
      setProfile(updated)
      updateStoredUser({ avatarUrl: updated.avatarUrl })
    } catch (err) {
      setAvatarErr(err.message || 'เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleRemoveAvatar() {
    setAvatarErr('')
    setUploadingAvatar(true)
    try {
      const updated = await authFetch(`/users/${profile.id}`, { method: 'PUT', body: { avatarUrl: null } })
      setProfile(updated)
      updateStoredUser({ avatarUrl: null })
    } catch (err) {
      setAvatarErr(err.message || 'ลบรูปโปรไฟล์ไม่สำเร็จ')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  if (loading) return <div className="page profile"><p className="empty-state">กำลังโหลด...</p></div>

  return (
    <div className="page profile">
      <Link to="/" className="profile__back">← กลับ</Link>

      <header className="profile__header">
        <p className="eyebrow">โปรไฟล์</p>
        <h1>ข้อมูลส่วนตัว</h1>
      </header>

      {loadError && <p className="empty-state">โหลดไม่สำเร็จ: {loadError}</p>}

      {profile && (
        <>
          <section className="profile__avatar-section">
            <div className="profile__avatar">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="รูปโปรไฟล์" />
              ) : (
                <span>{(profile.displayName || profile.username || '?').trim().charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="profile__avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
              <button
                type="button"
                className="profile__avatar-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
              </button>
              {profile.avatarUrl && (
                <button
                  type="button"
                  className="profile__avatar-remove"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                >
                  ลบรูป
                </button>
              )}
            </div>
            {avatarErr && <p className="auth-error">{avatarErr}</p>}
          </section>

          <section className="profile__card">
            <div className="profile__readonly-row">
              <span>ชื่อผู้ใช้</span>
              <strong>{profile.username}</strong>
            </div>
            <div className="profile__readonly-row">
              <span>บทบาท</span>
              <strong>{ROLE_LABEL[profile.role] || profile.role}</strong>
            </div>
            <div className="profile__readonly-row">
              <span>เป็นสมาชิกตั้งแต่</span>
              <strong>{formatDate(profile.createdAt)}</strong>
            </div>
          </section>

          {profile.role === 'ADMIN' && (
            <Link to="/admin/users" className="profile__admin-link">
              🛠 หน้าจัดการผู้ใช้งาน (Admin Dashboard)
            </Link>
          )}

          <form className="profile__card profile__form" onSubmit={handleSaveProfile}>
            <p className="profile__card-title">แก้ไขข้อมูลส่วนตัว</p>

            {profileErr && <p className="auth-error">{profileErr}</p>}
            {profileMsg && <p className="profile__success">{profileMsg}</p>}

            <label>
              ชื่อที่แสดง
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
            </label>

            <label>
              อีเมล
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <button className="auth-submit" type="submit" disabled={savingProfile}>
              {savingProfile ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </form>

          <form className="profile__card profile__form" onSubmit={handleChangePassword}>
            <p className="profile__card-title">เปลี่ยนรหัสผ่าน</p>

            {passwordErr && <p className="auth-error">{passwordErr}</p>}

            <label>
              รหัสผ่านปัจจุบัน
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              รหัสผ่านใหม่
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
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

            <button className="auth-submit" type="submit" disabled={changingPassword}>
              {changingPassword ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>

          <button className="profile__logout" onClick={handleLogout}>ออกจากระบบ</button>
        </>
      )}
    </div>
  )
}
