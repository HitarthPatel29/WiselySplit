// App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Navigate to='/login' replace />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  )
}
