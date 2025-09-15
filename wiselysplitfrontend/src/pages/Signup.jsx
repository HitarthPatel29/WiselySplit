// Signup.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import PasswordInput from '../components/PasswordInput'
import Divider from '../components/Divider'
import GoogleButton from '../components/GoogleButton'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })

  function update(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function onSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) return alert('Passwords do not match.')
    // TODO: replace with real API call
    alert('Signed up (demo).')
    navigate('/login')
  }

  return (
    <AuthLayout title='Create your account' subtitle='It only takes a minute'>
      <form onSubmit={onSubmit} className='flex flex-col gap-4'>
        <TextInput id='name' label='Full name' placeholder='Jane Doe' autoComplete='name' value={form.name} onChange={update} />
        <TextInput id='email' label='Email' type='email' placeholder='you@example.com' autoComplete='email' value={form.email} onChange={update} />
        <PasswordInput id='password' label='Password' value={form.password} onChange={update} />
        <PasswordInput id='confirm' label='Confirm password' value={form.confirm} onChange={update} />
        <button type='submit' className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'>
          Sign up
        </button>
        <Divider text='or' />
        <GoogleButton label='Sign up with Google' />
      </form>
      <p className='mt-6 text-center text-sm text-gray-600'>
        Already have an account? <Link to='/login' className='text-emerald-600 hover:underline'>Sign in</Link>
      </p>
    </AuthLayout>
  )
}
