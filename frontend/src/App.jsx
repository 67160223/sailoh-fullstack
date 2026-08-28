import { Routes, Route, useLocation } from 'react-router-dom'
import TopBar from './constants/components/TopBar'
import BottomNav from './constants/components/BottomNav'
import Home from './pages/Home'
import RouteDetail from './pages/RouteDetail'
import Saved from './pages/Saved'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import AdminUsers from './pages/AdminUsers'
import AdminUserDetail from './pages/AdminUserDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import { ProtectedRoute, GuestOnly, AdminRoute } from './constants/components/RouteGuards'

const HIDE_CHROME_ON = ['/login', '/register', '/forgot-password']

export default function App() {
  const location = useLocation()
  const hideChrome = HIDE_CHROME_ON.includes(location.pathname)

  return (
    <>
      {!hideChrome && <TopBar />}
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />

        <Route path="/" element={<Home />} />
        <Route path="/route/:id" element={<RouteDetail />} />
        <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
      </Routes>
      {!hideChrome && <BottomNav />}
    </>
  )
}
