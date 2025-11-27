import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { CameraIcon } from '@heroicons/react/24/solid'
import Header from '../components/Header.jsx'

export default function EditProfile() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null)

  const [form, setForm] = useState({
    name: '',
    userName: '',
    email: '',
    phoneNum: '',
    profilePicture: null,
  })

  const [previewUrl, setPreviewUrl] = useState(null)
  const [errors, setErrors] = useState({})

  // Load existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${userId}`)
        const data = res.data || {}

        setForm({
          name: data.name || '',
          userName: data.userName || '',
          email: data.email || '',
          phoneNum: data.phoneNum || '',
          profilePicture: null,
        })

        if (data.profilePicture) {
          setPreviewUrl(data.profilePicture)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchProfile()
  }, [userId])

  // --- Basic validations ---
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const validatePhone = (v) => {
    if (!v) return false
    const digits = String(v).replace(/[^0-9]/g, '')
    return /^\d{10}$/.test(digits)
  }

  const validateName = (v) => typeof v === 'string' && v.trim().length >= 2

  const validateUsernameFormat = (v) =>
    typeof v === 'string' && /^[a-zA-Z0-9._-]{3,30}$/.test(v)

  // --- Field Update ---
  function update(e) {
    const { name, value, type, files } = e.target

    // Clear specific field error
    setErrors((prev) => ({ ...prev, [name]: null }))

    if (type === 'file') {
      const file = files?.[0]
      if (!file) return

      if (file.size > 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profilePicture: 'Max file size is 1MB' }))
        return
      }

      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          profilePicture: 'Please upload an image file.',
        }))
        return
      }

      if (name === 'userName') {
        setUsernameAvailable(null) // reset on typing
      }

      setForm((f) => ({ ...f, profilePicture: file }))
      setPreviewUrl(URL.createObjectURL(file))
      return
    }

    setForm((f) => ({ ...f, [name]: value }))
  }

  // --- Username availability check ---
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
      const res = await api.get(`/users/${userId}/check-username`, {
        params: { username: form.userName },
      })

      console.log(res.data.available)

      if (!res.data.available) {
        setErrors((prev) => ({
          ...prev,
          userName: 'Username already taken',
        }))
      }else {setUsernameAvailable(true)}
    

    } catch (err) {
      console.error('username check failed:', err)
    }
  }

  // --- Email availability check ---
  const checkEmail = async () => {
    if (!validateEmail(form.email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid email format.' }))
      return
    }

    try {
      const res = await api.get(`/users/${userId}/check-email`, {
        params: { email: form.email },
      })

      if (!res.data.available) {
        setErrors((prev) => ({
          ...prev,
          email: 'Email already exists',
        }))
      }
    } catch (err) {
      console.error('email check failed:', err)
    }
  }

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({}) // reset

    const newErrors = {}

    if (!validateName(form.name)) newErrors.name = 'Please enter your full name.'
    if (!validateUsernameFormat(form.userName))
      newErrors.userName = 'Invalid username.'
    if (!validateEmail(form.email)) newErrors.email = 'Invalid email.'
    if (!validatePhone(form.phoneNum))
      newErrors.phoneNum = 'Enter a 10-digit phone number.'
    if (
      form.profilePicture &&
      !form.profilePicture.type.startsWith('image/')
    )
      newErrors.profilePicture = 'Profile picture must be an image.'

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('userName', form.userName)
      formData.append('email', form.email)
      formData.append('phoneNum', form.phoneNum)

      if (form.profilePicture) {
        formData.append('profilePicture', form.profilePicture)
      }

      await api.put(`/users/${userId}`, formData)
      navigate(-1)
    } catch (err) {
      console.error('Update error:', err)

      const data = err.response?.data
      if (data?.field && data?.message) {
        setErrors((prev) => ({ ...prev, [data.field]: data.message }))
      } else {
        setErrors((prev) => ({
          ...prev,
          general: 'Something went wrong while updating.',
        }))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return <div className="p-6 text-gray-600">Loading profile...</div>

  return (
    <div className="min-h-screen">
      <Header title="Edit Profile" />

      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* General Error */}
          {errors.general && (
            <p className="text-red-600 text-sm mb-2">{errors.general}</p>
          )}

          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 md:w-32 md:h-32">
              <label
                htmlFor="profilePicture"
                className="block w-full h-full rounded-full border-2 overflow-hidden cursor-pointer bg-gray-200"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-600 flex items-center justify-center h-full">
                    Upload
                  </div>
                )}

                <input
                  id="profilePicture"
                  name="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={update}
                  className="hidden"
                />
              </label>

              <div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full shadow-lg">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            {errors.profilePicture && (
              <p className="text-sm text-red-600 mt-2">{errors.profilePicture}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={update}
              className={`w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              name="userName"
              value={form.userName}
              onChange={update}
              onBlur={checkUsername}
              className={`w-full border rounded-xl px-3 py-2 focus:ring-2 ${
                errors.userName? 'border-red-500 focus:ring-red-300' 
                  : usernameAvailable === true ? 'border-green-500 focus:ring-green-300' : 'border-gray-300 focus:ring-emerald-400'
              }`}
            />
            {/* Red error text */}
            {errors.userName && (
              <p className="text-sm text-red-600 mt-1">{errors.userName}</p>
            )}
            {/* Green success text */}
            {!errors.userName && usernameAvailable === true && (
              <p className="text-sm text-green-600 mt-1">Username available ✓</p>
            )}
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                name="phoneNum"
                value={form.phoneNum}
                onChange={update}
                className={`w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 ${
                  errors.phoneNum ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phoneNum && (
                <p className="text-sm text-red-600 mt-1">{errors.phoneNum}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={update}
                onBlur={checkEmail}
                className={`w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Reset Password */}
          <button
            type="button"
            onClick={() => navigate('/reset-password')}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-xl py-3"
          >
            Reset Password
          </button>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 font-semibold rounded-xl py-3"
          >
            Cancel
          </button>
        </form>
      </main>
    </div>
  )
}