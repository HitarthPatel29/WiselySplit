// src/pages/auth/ResetPassword.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import TextInput from '../../components/IO/TextInput.jsx'
import OtpInput from '../../components/auth/OtpInput.jsx'
import PasswordInput from '../../components/auth/PasswordInput.jsx'
import api from '../../api.js'
import BackButton from '../../components/IO/BackButton.jsx'
import { useNotification } from '../../context/NotificationContext'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pass, setPass] = useState({ p1: '', p2: '' })
  const [resetToken, setResetToken] = useState('')

  async function sendCode(e) {
    e.preventDefault()
    try {
      await api.post('/auth/reset/request', { email })
      showSuccess('OTP sent to your email.', { asSnackbar: true })
      setStep(2)
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send OTP', { asSnackbar: true })
    }
  }

  async function verifyCode(e) {
    e.preventDefault()
    try {
      const res = await api.post('/auth/reset/verify', { email, otp })
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken)
        showSuccess('OTP verified.', { asSnackbar: true })
        setStep(3)
      } else {
        showError('No reset token received from server.', { asSnackbar: true })
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid or expired OTP', { asSnackbar: true })
    }
  }

  async function setPassword(e) {
    e.preventDefault()
    if (pass.p1 !== pass.p2) {
      showError('Passwords do not match.', { asSnackbar: true })
      return
    }
    try {
      await api.post('/auth/reset/confirm', {
        resetToken,
        newPassword: pass.p1
      })
      showSuccess('Password updated successfully. You can now sign in.', { asSnackbar: true })
      setStep(1)
      navigate('/login')
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update password', { asSnackbar: true })
    }
  }

  return (
    <AuthLayout title='Reset your password' subtitle='We will guide you through 3 quick steps'>
      <BackButton/>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {step === 1 && 'Step 1 of 3: Enter your email to receive a reset code'}
        {step === 2 && 'Step 2 of 3: Enter the verification code sent to your email'}
        {step === 3 && 'Step 3 of 3: Set your new password'}
      </div>

      {step === 1 && (
        <form onSubmit={sendCode} className='flex flex-col gap-4' aria-label="Password reset form - Step 1">
          <TextInput 
            id='email' 
            label='Email' 
            type='email' 
            placeholder='you@example.com' 
            autoComplete='email' 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required={true}
          />
          <button 
            type='submit' 
            className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400'
          >
            Send code
          </button>
        </form>
      )}

      
      {step === 2 && (
        <form onSubmit={verifyCode} className='flex flex-col gap-4' aria-label="Password reset form - Step 2">
          <label htmlFor='otp' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Enter 6-digit code sent to {email}
          </label>
          <OtpInput value={otp} onChange={setOtp} />
          <button 
            type='submit' 
            className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400'
          >
            Verify code
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={setPassword} className='flex flex-col gap-4' aria-label="Password reset form - Step 3">
          <PasswordInput 
            id='new-password' 
            name='new-password'
            label='New password' 
            value={pass.p1} 
            onChange={e => setPass(s => ({ ...s, p1: e.target.value }))} 
            showStrength={true} 
            autoComplete='new-password' 
            required={true}
            onStrengthChange={(val) => setPass(s => ({ ...s, strength: val }))}
          />
          <PasswordInput 
            id='confirm-password' 
            name='confirm-password'
            label='Confirm password' 
            value={pass.p2} 
            onChange={e => setPass(s => ({ ...s, p2: e.target.value }))} 
            autoComplete='new-password'
            required={true}
          />
                
          {/* Password match indicator */}
          {pass.p2 && (
            <p 
              role="alert"
              aria-live="polite"
              className={`text-sm ${pass.p1 === pass.p2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              <span aria-hidden="true">{pass.p1 === pass.p2 ? '✓' : '✗'}</span>{' '}
              {pass.p1 === pass.p2 ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}

          <button
            type='submit'
            disabled={!(pass.strength > 4 && pass.p1 === pass.p2)}
            aria-describedby={!(pass.strength > 4 && pass.p1 === pass.p2) ? "password-requirements" : undefined}
            className={`w-full rounded-xl py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              pass.strength > 4 && pass.p1 === pass.p2
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed focus:ring-gray-400'
            }`}
          >
            Update password
          </button>
          {!(pass.strength > 4 && pass.p1 === pass.p2) && (
            <p id="password-requirements" className="sr-only">
              Password must be strong and match confirmation field to update
            </p>
          )}
        </form>
      )}

      <p className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
        <Link 
          to='/login' 
          className='text-emerald-600 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:rounded'
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}