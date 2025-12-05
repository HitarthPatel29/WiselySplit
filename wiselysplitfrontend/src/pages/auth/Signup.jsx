// src/pages/auth/Signup.jsx
import React, { useState, useRef } from 'react'
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
  const fileInputRef = useRef(null)
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
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [emailAvailable, setEmailAvailable] = useState(null)
  const [errors, setErrors] = useState({})

  // Validation functions
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const validateUsernameFormat = (v) =>
    typeof v === 'string' && /^[a-zA-Z0-9._-]{3,30}$/.test(v)

  function update(e) {
    const { name, type, value, files } = e.target

    // Clear specific field error
    setErrors((prev) => ({ ...prev, [name]: null }))

    if (type === 'file') {
      setForm(f => ({
        ...f,
        [name]: files[0] || null
      }))
      return
    }

    setForm(f => ({
      ...f,
      [name]: value
    }))

    // Reset availability on typing
    if (name === 'userName') {
      setUsernameAvailable(null)
    }
    if (name === 'email') {
      setEmailAvailable(null)
    }
  }

  // Username availability check
  const checkUsername = async () => {
    if (!validateUsernameFormat(form.userName)) {
      setErrors((prev) => ({
        ...prev,
        userName: 'Invalid username format.',
      }))
      setUsernameAvailable(false)
      return
    }

    try {
      const res = await api.get('/users/check-username', {
        params: { username: form.userName },
      })

      if (!res.data.available) {
        setErrors((prev) => ({
          ...prev,
          userName: 'Username already taken',
        }))
        setUsernameAvailable(false)
      } else {
        setUsernameAvailable(true)
        setErrors((prev) => ({ ...prev, userName: null }))
      }
    } catch (err) {
      console.error('username check failed:', err)
    }
  }

  // Email availability check
  const checkEmail = async () => {
    if (!validateEmail(form.email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid email format.' }))
      setEmailAvailable(false)
      return
    }

    try {
      const res = await api.get('/users/check-email', {
        params: { email: form.email },
      })

      if (!res.data.available) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email already exists',
        }))
        setEmailAvailable(false)
      } else {
        setEmailAvailable(true)
        setErrors((prev) => ({ ...prev, email: null }))
      }
    } catch (err) {
      console.error('email check failed:', err)
    }
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

    // Validate username format if not already checked
    if (!validateUsernameFormat(form.userName)) {
      setErrors((prev) => ({
        ...prev,
        userName: 'Invalid username format.',
      }))
      showError('Please fix username errors before continuing.', { asSnackbar: true })
      return
    }

    // Validate email format if not already checked
    if (!validateEmail(form.email)) {
      setErrors((prev) => ({
        ...prev,
        email: 'Invalid email format.',
      }))
      showError('Please fix email errors before continuing.', { asSnackbar: true })
      return
    }

    // Check if username/email have been validated and are available
    if (usernameAvailable === false || errors.userName) {
      showError('Username is not available. Please choose a different one.', { asSnackbar: true })
      return
    }

    if (emailAvailable === false || errors.email) {
      showError('Email is already in use. Please use a different email.', { asSnackbar: true })
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
            <div className='flex flex-col gap-1'>
              <label 
                htmlFor='userName' 
                className='text-sm font-medium text-gray-500 dark:text-gray-400'
              >
                Username
                <span className="text-red-500 ml-1" aria-label="required">*</span>
              </label>
              <input
                id='userName'
                name='userName'
                type='text'
                placeholder='janedoe'
                autoComplete='username'
                value={form.userName}
                onChange={update}
                onBlur={checkUsername}
                required={true}
                aria-required={true}
                aria-invalid={errors.userName ? 'true' : 'false'}
                className={`block w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                  errors.userName
                    ? 'border-red-500 focus:ring-red-300 focus:border-red-500'
                    : usernameAvailable === true
                    ? 'border-green-500 focus:ring-green-300 focus:border-green-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-400 focus:border-emerald-400'
                }`}
              />
              {errors.userName && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert" aria-live="polite">
                  {errors.userName}
                </p>
              )}
              {!errors.userName && usernameAvailable === true && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Username available ✓
                </p>
              )}
            </div>
          </div>

          {/* Phone + Email */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <TextInput id='phoneNum' label='Phone Number' type='tel' placeholder='+1 234 567 8901' autoComplete='tel' value={form.phoneNum} onChange={update} required={true} />
            <div className='flex flex-col gap-1'>
              <label 
                htmlFor='email' 
                className='text-sm font-medium text-gray-500 dark:text-gray-400'
              >
                Email
                <span className="text-red-500 ml-1" aria-label="required">*</span>
              </label>
              <input
                id='email'
                name='email'
                type='email'
                placeholder='you@example.com'
                autoComplete='email'
                value={form.email}
                onChange={update}
                onBlur={checkEmail}
                required={true}
                aria-required={true}
                aria-invalid={errors.email ? 'true' : 'false'}
                className={`block w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-300 focus:border-red-500'
                    : emailAvailable === true
                    ? 'border-green-500 focus:ring-green-300 focus:border-green-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-400 focus:border-emerald-400'
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert" aria-live="polite">
                  {errors.email}
                </p>
              )}
              {!errors.email && emailAvailable === true && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Email available ✓
                </p>
              )}
            </div>
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
            onClick={(e) => {
              e.preventDefault()
              handleSubmit(e)
            }}
            disabled={loading}
            aria-busy={loading}
            className='w-full rounded-xl py-2 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50'
            aria-label="Skip profile picture and create account"
          >
            {loading ? 'Creating account...' : 'Skip for now'}
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