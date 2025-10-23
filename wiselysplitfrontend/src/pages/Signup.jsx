import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import PasswordInput from '../components/PasswordInput'
import Divider from '../components/Divider'
import GoogleButton from '../components/GoogleButton'
import { CameraIcon } from '@heroicons/react/24/solid'
import api from '../api.js'

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    userName: '',
    email: '',
    phoneNum: '',
    password: '',
    confirm: '',
    profilePicture: null
  })
  const [loading, setLoading] = useState(false)

  function update(e) {
    const { name, type, value, files } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'file' ? files[0] : value
    }))
  }

  const passwordValid = {
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
    length: form.password.length >= 8
  }
  const passedRules = Object.values(passwordValid).filter(Boolean).length
  const confirmMatch = form.password && form.confirm && form.password === form.confirm
  const canSubmit = passedRules >= 4 && confirmMatch

  // Step 1 → basic account info
  const handleStep1 = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      return alert('Password must be at least "Good" strength and match confirm field.')
    }
    setStep(2)
  }

  // Step 2 → submit with/without picture
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("userName", form.userName);
      formData.append("email", form.email);
      formData.append("phoneNum", form.phoneNum);
      formData.append("password", form.password);
      if (form.profilePicture) {
        formData.append("profilePicture", form.profilePicture);
      }

      await api.post("/users", formData); // let Axios set headers
      alert("Signup successful! Please login with your credentials.");

      // initailize first login flag for onboarding
      localStorage.setItem('firstLogin', 'true')
      
      navigate("/login");
    } catch (err) {
      console.error(err); // log error in console
      alert(err.response?.data || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title='Create your account' subtitle='It only takes a minute'>
      {step === 1 && (
        <form onSubmit={handleStep1} className='flex flex-col gap-4'>
          {/* Full name + Username */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <TextInput id='name' label='Full name' placeholder='Jane Doe' autoComplete='name' value={form.name} onChange={update} />
            <TextInput id='userName' label='Username' placeholder='janedoe' autoComplete='username' value={form.userName} onChange={update} />
          </div>

          {/* Phone + Email */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <TextInput id='phoneNum' label='Phone Number' type='tel' placeholder='+1 234 567 8901' autoComplete='tel' value={form.phoneNum} onChange={update} />
            <TextInput id='email' label='Email' type='email' placeholder='you@example.com' autoComplete='email' value={form.email} onChange={update} />
          </div>

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
            Continue
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className='flex flex-col items-center gap-6'>
          {/* Profile picture upload */}
          <label
            htmlFor='profilePicture'
            className='relative h-32 w-32 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer overflow-hidden'
          >
            {form.profilePicture ? (
              <img
                src={URL.createObjectURL(form.profilePicture)}
                alt='Profile preview'
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex flex-col items-center text-white'>
                <CameraIcon className='h-8 w-8' />
                <span className='text-xs'>Update Photo</span>
              </div>
            )}
            <input
              id='profilePicture'
              name='profilePicture'
              type='file'
              accept='image/*'
              onChange={update}
              className='hidden'
            />
          </label>

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-xl py-2 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50'
          >
            {loading ? 'Creating account...' : 'Finish & Create Account'}
          </button>

          <button
            type='button'
            onClick={handleSubmit}
            className='w-full rounded-xl py-2 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300'
          >
            Skip for now
          </button>
        </form>
      )}

      <p className='mt-6 text-center text-sm text-gray-600'>
        Already have an account?{' '}
        <Link to='/login' className='text-emerald-600 hover:underline'>Sign in</Link>
      </p>
    </AuthLayout>
  )
}