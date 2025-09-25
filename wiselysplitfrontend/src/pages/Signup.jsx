import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import PasswordInput from '../components/PasswordInput'
import Divider from '../components/Divider'
import GoogleButton from '../components/GoogleButton'
import api from '../api.js';

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    userName: '',
    email: '',
    phoneNum: '',
    password: '',
    confirm: '',
    profilePicture: ''
  })

  function update(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const passwordValid = {
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
    length: form.password.length >= 8
  };

  const passedRules = Object.values(passwordValid).filter(Boolean).length;
  const strength = passedRules; 
  const confirmMatch = form.password && form.confirm && form.password === form.confirm;

  const canSubmit = strength >= 4 && confirmMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      return alert('Password must be at least "Good" strength and match confirm field.');
    }

    try {
      await api.post('/users', form);
      alert('Signup successful! Please login with your credentials.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    
    <AuthLayout title='Create your account' subtitle='It only takes a minute'>
      {/* Back Button */}
      <button
        type='button'
        onClick={() => navigate(-1)}
        className='absolute top-4 left-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300'
      >
        ← Back
      </button>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <TextInput id='name' label='Full name' placeholder='Jane Doe' autoComplete='name' value={form.name} onChange={update} />
        <TextInput id='userName' label='Username' placeholder='janedoe' autoComplete='username' value={form.userName} onChange={update} />
        <TextInput id='phoneNum' label='Phone Number' type='tel' placeholder='+1 234 567 8901' autoComplete='tel' value={form.phoneNum} onChange={update} />
        <TextInput id='email' label='Email' type='email' placeholder='you@example.com' autoComplete='email' value={form.email} onChange={update} />
        
        <PasswordInput id='password' label='Password' value={form.password} onChange={update} showStrength={true} autoComplete='new-password' />
        <PasswordInput id='confirm' label='Confirm password' value={form.confirm} onChange={update} autoComplete='new-password' />    

        {form.confirm && (
          <p className={`text-sm ${confirmMatch ? 'text-green-600' : 'text-red-600'}`}>
            {confirmMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}

        <button
          type='submit'
          disabled={!canSubmit}
          className={`w-full rounded-xl py-2 font-semibold focus:outline-none focus:ring-2 ${
            canSubmit
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
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