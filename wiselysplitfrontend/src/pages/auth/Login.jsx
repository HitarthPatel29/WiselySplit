// src/pages/auth/Login.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import TextInput from '../../components/IO/TextInput.jsx'
import PasswordInput from '../../components/auth/PasswordInput.jsx'
import Divider from '../../components/Divider.jsx'
import GoogleButton from '../../components/auth/GoogleButton.jsx'
import OtpInput from '../../components/auth/OtpInput.jsx'
import api from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = login, 2 = OTP
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  function update(e) {
    const { name, type, value, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  // Step 1: submit email + password (send OTP)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        email: form.email,
        password: form.password
      });
      if (res.data.message) {
        alert('OTP sent to your email. Please check your inbox.')
        setStep(2)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false)
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', {
        email: form.email,
        otp: otp
      });
      if (res.data.token) {
        login(res.data.token, form.remember)
        alert('Login successful! :' + form.email)
        navigate('/dashboard')
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        email: form.email,
        password: form.password
      });
      if (res.data.message) {
        alert('A new OTP has been sent to your email.')
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  };

  return (
    <AuthLayout title='Welcome!' subtitle='Sign in to continue'>
      {step === 1 && (
        <form onSubmit={handleLogin} className='flex flex-col gap-4'>
          <TextInput
            id='email'
            label='Email'
            type='email'
            placeholder='you@example.com'
            autoComplete='email'
            value={form.email}
            onChange={update}
          />
          <PasswordInput
            id='password'
            name='password'
            label='Password'
            value={form.password}
            onChange={update}
            autoComplete='current-password'
          />
          <div className='flex items-center justify-between'>
            <label className='inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
              <input
                id='remember'
                name='remember'
                type='checkbox'
                className='h-4 w-4 rounded border-gray-300'
                checked={form.remember}
                onChange={update}
              />
              <span>Remember me</span>
            </label>
            <Link to='/reset-password' className='text-sm text-emerald-600 hover:underline'>
              Forgot password?
            </Link>
          </div>
          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50'
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          <Divider />
          <GoogleButton label='Sign in with Google' />
          
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className='flex flex-col gap-4'>
          <label htmlFor='otp' className='block text-sm font-medium text-gray-500 dark:text-gray-400'> Enter 6-digit code sent to {form.email} </label>

          <OtpInput value={otp} onChange={setOtp} />
          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type='button'
            onClick={handleResendOtp}
            disabled={loading}
            className='w-full rounded-xl bg-gray-200 py-2 text-gray-700 font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50'
          >
            Resend OTP
          </button>
        </form>
      )}

      <p className='mt-6 text-center text-sm text-gray-500 dark:text-gray-400'>
        New here?{' '}
        <Link to='/signup' className='text-emerald-600 hover:underline'>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
