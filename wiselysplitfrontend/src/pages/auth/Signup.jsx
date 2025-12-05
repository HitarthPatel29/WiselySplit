// src/pages/auth/Signup.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import TextInput from '../../components/IO/TextInput.jsx'
import PasswordInput from '../../components/auth/PasswordInput.jsx'
import Divider from '../../components/Divider.jsx'
import GoogleButton from '../../components/auth/GoogleButton.jsx'
import { CameraIcon } from '@heroicons/react/24/solid'
import api from '../../api.js'
import { useNotification } from '../../context/NotificationContext'

export default function Signup() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
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
      showError('Password must be at least "Good" strength and match confirm field.', { asSnackbar: true })
      return
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
      showSuccess("Signup successful! Please login with your credentials.", { asSnackbar: true });

      // initailize first login flag for onboarding
      localStorage.setItem('firstLogin', 'true')
      
      navigate("/login");
    } catch (err) {
      console.error(err); // log error in console
      showError(err.response?.data || "Signup failed", { asSnackbar: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title='Create your account' subtitle='It only takes a minute'>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && step === 2 && 'Creating account, please wait'}
      </div>

      {step === 1 && (
        <form onSubmit={handleStep1} className='flex flex-col gap-4' aria-label="Account creation form - Step 1">
          {/* Full name + Username */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <TextInput id='name' label='Full name' placeholder='Jane Doe' autoComplete='name' value={form.name} onChange={update} required={true} />
            <TextInput id='userName' label='Username' placeholder='janedoe' autoComplete='username' value={form.userName} onChange={update} required={true} />
          </div>

          {/* Phone + Email */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <TextInput id='phoneNum' label='Phone Number' type='tel' placeholder='+1 234 567 8901' autoComplete='tel' value={form.phoneNum} onChange={update} required={true} />
            <TextInput id='email' label='Email' type='email' placeholder='you@example.com' autoComplete='email' value={form.email} onChange={update} required={true} />
          </div>

          <PasswordInput id='password' name='password' label='Password' value={form.password} onChange={update} showStrength={true} autoComplete='new-password' required={true} />
          <PasswordInput id='confirm' name='confirm' label='Confirm password' value={form.confirm} onChange={update} autoComplete='new-password' required={true} />

          {form.confirm && (
            <p 
              role="alert"
              aria-live="polite"
              className={`text-sm ${confirmMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              <span aria-hidden="true">{confirmMatch ? '✓' : '✗'}</span>{' '}
              {confirmMatch ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}

          <button
            type='submit'
            disabled={!canSubmit}
            aria-describedby={!canSubmit ? "submit-requirements" : undefined}
            className={`w-full rounded-xl py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              canSubmit
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed focus:ring-gray-400'
            }`}
          >
            Continue
          </button>
          {!canSubmit && (
            <p id="submit-requirements" className="sr-only">
              Password must meet requirements and match confirmation field to continue
            </p>
          )}
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className='flex flex-col items-center gap-6' aria-label="Account creation form - Step 2: Profile picture">
          {/* Profile picture upload */}
          <label
            htmlFor='profilePicture'
            className='relative h-32 w-32 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-emerald-400'
            aria-label="Upload profile picture"
          >
            {form.profilePicture ? (
              <img
                src={URL.createObjectURL(form.profilePicture)}
                alt='Profile preview'
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex flex-col items-center text-white dark:text-gray-300'>
                <CameraIcon className='h-8 w-8' aria-hidden="true" />
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
              aria-label="Choose profile picture file"
            />
          </label>

          <button
            type='submit'
            disabled={loading}
            aria-busy={loading}
            className='w-full rounded-xl py-2 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50'
          >
            {loading ? 'Creating account...' : 'Finish & Create Account'}
          </button>

          <button
            type='button'
            onClick={handleSubmit}
            className='w-full rounded-xl py-2 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400'
            aria-label="Skip profile picture and create account"
          >
            Skip for now
          </button>
        </form>
      )}

      <p className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
        Already have an account?{' '}
        <Link 
          to='/login' 
          className='text-emerald-600 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:rounded'
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}