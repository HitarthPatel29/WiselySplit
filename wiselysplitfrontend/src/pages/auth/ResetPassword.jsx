// src/pages/auth/ResetPassword.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import TextInput from '../../components/IO/TextInput.jsx'
import OtpInput from '../../components/auth/OtpInput.jsx'
import PasswordInput from '../../components/auth/PasswordInput.jsx'
import api from '../../api.js'
import BackButton from '../../components/IO/BackButton.jsx'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pass, setPass] = useState({ p1: '', p2: '' })
  const [resetToken, setResetToken] = useState('')

  async function sendCode(e) {
    e.preventDefault()
    try {
      await api.post('/auth/reset/request', { email })
      alert('OTP sent to your email.')
      setStep(2)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP')
    }
  }

  async function verifyCode(e) {
    e.preventDefault()
    try {
      const res = await api.post('/auth/reset/verify', { email, otp })
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken)
        alert('OTP verified.')
        setStep(3)
      } else {
        alert('No reset token received from server.')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid or expired OTP')
    }
  }

  async function setPassword(e) {
    e.preventDefault()
    if (pass.p1 !== pass.p2) return alert('Passwords do not match.')
    try {
      await api.post('/auth/reset/confirm', {
        resetToken,
        newPassword: pass.p1
      })
      alert('Password updated successfully. You can now sign in.')
      setStep(1)
      navigate('/login')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password')
    }
  }

  return (
    <AuthLayout title='Reset your password' subtitle='We will guide you through 3 quick steps'>
      <BackButton/>
      {step === 1 && (
        <form onSubmit={sendCode} className='flex flex-col gap-4'>
          <TextInput id='email' label='Email' type='email' placeholder='you@example.com' autoComplete='email' value={email} onChange={e => setEmail(e.target.value)} />
          <button type='submit' className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'>
            Send code
          </button>
        </form>
      )}

      
      {step === 2 && (
        <form onSubmit={verifyCode} className='flex flex-col gap-4'>
          <label htmlFor='otp' className='block text-sm font-medium text-gray-700 dark:text-gray-300'> Enter 6-digit code </label>
          <OtpInput value={otp} onChange={setOtp} />
          <button type='submit' className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'>
            Verify code
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={setPassword} className='flex flex-col gap-4'>
          <PasswordInput id='new-password' label='New password' value={pass.p1} onChange={e => setPass(s => ({ ...s, p1: e.target.value }))} showStrength={true} autoComplete='new-password' onStrengthChange={(val) => setPass(s => ({ ...s, strength: val }))}/>
          <PasswordInput id='confirm-password' label='Confirm password' value={pass.p2} onChange={e => setPass(s => ({ ...s, p2: e.target.value }))} autoComplete='new-password'/>
                
          {/* Password match indicator */}
          {pass.p2 && (
            <p className={`text-sm ${pass.p1 === pass.p2 ? 'text-green-600' : 'text-red-600'}`}>
              {pass.p1 === pass.p2 ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}

          <button
            type='submit'
            disabled={!(pass.strength > 4 && pass.p1 === pass.p2)}
            className={`w-full rounded-xl py-2 font-semibold focus:outline-none focus:ring-2 ${
              pass.strength > 4 && pass.p1 === pass.p2
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Update password
          </button>
        </form>
      )}

      <p className='mt-6 text-center text-sm text-gray-600'>
        <Link to='/login' className='text-emerald-600 hover:underline'>Back to sign in</Link>
      </p>
    </AuthLayout>
  )
}