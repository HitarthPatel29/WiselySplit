// Dashboard.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export default function Dashboard() {
  return (
    <AuthLayout title='Dashboard' subtitle='Demo screen after auth'>
      <div className='text-center space-y-4'>
        <p className='text-gray-700'>You are signed in. Replace this with your app.</p>
        <Link to='/login' className='inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50'>Sign out</Link>
      </div>
    </AuthLayout>
  )
}
