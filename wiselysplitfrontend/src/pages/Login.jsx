// Login.jsx
import { API_BASE_URL } from '../tailwind.config.js';
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import PasswordInput from '../components/PasswordInput'
import Divider from '../components/Divider'
import GoogleButton from '../components/GoogleButton'
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: false })

  function update(e) {
    const { name, type, value, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token);
      //localStorage.setItem('token', res.data.token);
      alert('Login successful! :' + form);
      navigate('/dashboard')
      //if (onLogin) onLogin(res.data.token);
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }

  };

  return (
    <AuthLayout title='Welcome!' subtitle='Sign in to continue'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <TextInput id='email' label='Email' type='email' placeholder='you@example.com' autoComplete='email' value={form.email} onChange={update} />
        <PasswordInput id='password' label='Password' value={form.password} onChange={update} />
        <div className='flex items-center justify-between'>
          <label className='inline-flex items-center gap-2 text-sm text-gray-700'>
            <input id='remember' name='remember' type='checkbox' className='h-4 w-4 rounded border-gray-300' checked={form.remember} onChange={update} />
            <span>Remember me</span>
          </label>
          <Link to='/reset-password' className='text-sm text-emerald-600 hover:underline'>Forgot password?</Link>
        </div>
        <button type='submit' className='w-full rounded-xl bg-emerald-500 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'>
          Log in
        </button>
        <Divider />
        <GoogleButton label='Sign in with Google' />
      </form>
      <p className='mt-6 text-center text-sm text-gray-600'>
        New here? <Link to='/signup' className='text-emerald-600 hover:underline'>Create an account</Link>
      </p>
    </AuthLayout>
  )
}
