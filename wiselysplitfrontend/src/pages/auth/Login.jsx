// src/pages/auth/Login.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import TextInput from '../../components/IO/TextInput.jsx'
import PasswordInput from '../../components/auth/PasswordInput.jsx'
import Divider from '../../components/Divider.jsx'
import GoogleButton from '../../components/auth/GoogleButton.jsx'
import OtpInput from '../../components/auth/OtpInput.jsx'
import AnimatedDollarSlashLogo from '../../components/AnimatedDollarSlashLogo.jsx'
import api from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotification } from '../../context/NotificationContext'
import Logo from '../../components/Logo.jsx'

export default function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()

  const [showAnimation, setShowAnimation] = useState(true)
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
        showSuccess('OTP sent to your email. Please check your inbox.', { asSnackbar: true })
        setStep(2)
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Login failed', { asSnackbar: true });
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
        showSuccess('Login successful!', { asSnackbar: true })
        navigate('/dashboard')
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Invalid or expired OTP', { asSnackbar: true })
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
        showSuccess('A new OTP has been sent to your email.', { asSnackbar: true })
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to resend OTP', { asSnackbar: true })
    } finally {
      setLoading(false)
    }
  };

  return (
    <>
      {showAnimation && (
        <AnimatedDollarSlashLogo onAnimationComplete={() => setShowAnimation(false)} />
      )}
      <AuthLayout title='Welcome!' subtitle='Sign in to continue' withlogo={true}>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && step === 1 && 'Logging in, please wait'}
        {loading && step === 2 && 'Verifying OTP, please wait'}
        {step === 2 && 'Please enter the 6-digit verification code sent to your email'}
      </div>

      {step === 1 && (
        <form 
          onSubmit={handleLogin} 
          className='flex flex-col gap-4'
          aria-label="Login form"
        >
          <TextInput
            id='email'
            label='Email'
            type='email'
            placeholder='you@example.com'
            autoComplete='email'
            value={form.email}
            onChange={update}
            required={true}
            aria-required="true"
          />
          <PasswordInput
            id='password'
            name='password'
            label='Password'
            value={form.password}
            onChange={update}
            autoComplete='current-password'
            required={true}
            aria-required="true"
          />
          <div className='flex items-center justify-between'>
            <label className='inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
              <input
                id='remember'
                name='remember'
                type='checkbox'
                className='h-4 w-4 rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-400'
                checked={form.remember}
                onChange={update}
                aria-describedby="remember-description"
              />
              <span id="remember-description">Remember me</span>
            </label>
            <Link 
              to='/reset-password' 
              className='text-sm text-emerald-600 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:rounded'
              aria-label="Reset your password"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type='submit'
            disabled={loading}
            aria-busy={loading}
            className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50'
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          <Divider />
          <GoogleButton label='Sign in with Google' />
          
        </form>
      )}

      {step === 2 && (
        <form 
          onSubmit={handleVerifyOtp} 
          className='flex flex-col gap-4'
          aria-label="OTP verification form"
        >
          <label 
            htmlFor='otp' 
            className='block text-sm font-medium text-gray-500 dark:text-gray-400'
          >
            Enter 6-digit code sent to <span className="font-semibold">{form.email}</span>
          </label>

          <OtpInput value={otp} onChange={setOtp} />
          <button
            type='submit'
            disabled={loading}
            aria-busy={loading}
            className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50'
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type='button'
            onClick={handleResendOtp}
            disabled={loading}
            aria-busy={loading}
            className='w-full rounded-xl bg-gray-200 dark:bg-gray-700 py-2 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50'
          >
            Resend OTP
          </button>
        </form>
      )}

      <p className='mt-6 text-center text-sm text-gray-500 dark:text-gray-400'>
        New here?{' '}
        <Link 
          to='/signup' 
          className='text-emerald-600 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:rounded'
          aria-label="Create a new account"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
    </>
  )
}
