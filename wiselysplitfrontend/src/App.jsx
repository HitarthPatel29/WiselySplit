// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'
import InviteUser from './pages/InviteUser'
import InviteNotifications from './pages/InviteNotifications'

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>  // or spinner
  }

  return token ? children : <Navigate to="/" replace />
} 

function OnboardingRoute({ children }) {
  const { token, loading, firstLogin } = useAuth()

  if (loading) return <div>Loading...</div>

  // If logged in & first time → show onboarding (invite)
  if (token && firstLogin) return children

  // Otherwise skip to dashboard
  if (token && !firstLogin) return <Navigate to='/dashboard' replace />

  // If not logged in
  return <Navigate to='/login' replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected route(s) */}
      <Route path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="/invite"
        element={
          <PrivateRoute>
            <InviteUser />
          </PrivateRoute>
        }
      />
      <Route path="/dashboard/invites"
        element={
          <PrivateRoute>
            <InviteNotifications />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}