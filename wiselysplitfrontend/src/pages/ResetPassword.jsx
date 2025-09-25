// ResetPassword.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import PasswordInput from '../components/PasswordInput'

export default function ResetPassword() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pass, setPass] = useState({ p1: '', p2: '' })

  function sendCode(e) {
    e.preventDefault()
    // TODO: send email OTP
    alert('OTP sent (demo).')
    setStep(2)
  }
  function verifyCode(e) {
    e.preventDefault()
    // TODO: verify OTP
    alert('OTP verified (demo).')
    setStep(3)
  }
  function setPassword(e) {
    e.preventDefault()
    if (pass.p1 !== pass.p2) return alert('Passwords do not match.')
    // TODO: update password
    alert('Password updated (demo).')
    setStep(1)
  }

  return (
    <AuthLayout title='Reset your password' subtitle='We will guide you through 3 quick steps'>
      <button
        type='button'
        onClick={() => navigate(-1)}
        className='absolute top-4 left-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300'
      >
        ← Back
      </button>
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
          <TextInput id='otp' label='Enter 6-digit code' type='text' placeholder='123456' value={otp} onChange={e => setOtp(e.target.value)} />
          <button type='submit' className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'>
            Verify code
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={setPassword} className='flex flex-col gap-4'>
          <PasswordInput id='new-password' label='New password' value={pass.p1} onChange={e => setPass(s => ({ ...s, p1: e.target.value }))} />
          <PasswordInput id='confirm-password' label='Confirm password' value={pass.p2} onChange={e => setPass(s => ({ ...s, p2: e.target.value }))} />
          <button type='submit' className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'>
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
