import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/IO/BackButton'
import api from '../api'
import { CameraIcon } from '@heroicons/react/24/solid'

export default function EditProfile() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    userName: '',
    email: '',
    phoneNum: '',
    profilePicture: null,
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [errors, setErrors] = useState({})
  const [usernameAvailable, setUsernameAvailable] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${userId}`)
        const data = res.data || {}
        setForm({
          name: data.name || '',
          userName: data.userName || data.username || '',
          email: data.email || '',
          phoneNum: data.phoneNum || data.phone || '',
          profilePicture: null,
        })
        if (data.profilePicture) setPreviewUrl(data.profilePicture)
      } catch (err) {
        console.error(err)
        alert('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchProfile()
  }, [userId])

  // Validation helpers
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const validatePhone = (v) => /^(?:\d{10})$/.test(v.replace(/[^0-9]/g, ''))
  const validateName = (v) => typeof v === 'string' && v.trim().length >= 2
  const validateUsernameFormat = (v) => typeof v === 'string' && /^[a-zA-Z0-9._-]{3,30}$/.test(v)

  // Field change
  function update(e) {
    const { name, value, files, type } = e.target
    if (type === 'file') {
      const file = files[0]
      if (file) {
        // validate image
        if (!file.type.startsWith('image/')) {
          setErrors((s) => ({ ...s, profilePicture: 'Please upload an image file.' }))
          return
        }
        setErrors((s) => ({ ...s, profilePicture: null }))
        setForm((f) => ({ ...f, profilePicture: file }))
        setPreviewUrl(URL.createObjectURL(file))
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }))
      setErrors((s) => ({ ...s, [name]: null }))
      if (name === 'userName') {
        setUsernameAvailable(null)
      }
    }
  }

  // Check username availability (on blur)
  async function checkUsername() {
    if (!validateUsernameFormat(form.userName)) {
      setErrors((s) => ({ ...s, userName: 'Invalid username format.' }))
      return
    }
    try {
      const res = await api.get('/users/check-username', { params: { username: form.userName } })
      setUsernameAvailable(res.data?.available === true)
      if (!res.data?.available) setErrors((s) => ({ ...s, userName: 'Username is already taken.' }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!validateName(form.name)) newErrors.name = 'Please enter your full name.'
    if (!validateUsernameFormat(form.userName)) newErrors.userName = 'Invalid username.'
    if (!validateEmail(form.email)) newErrors.email = 'Invalid email.'
    if (!validatePhone(form.phoneNum)) newErrors.phoneNum = 'Enter a 10-digit phone number.'
    if (form.profilePicture && !form.profilePicture.type.startsWith('image/')) newErrors.profilePicture = 'Profile picture must be an image.'

    setErrors(newErrors)
    if (Object.keys(newErrors).length) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('userName', form.userName)
      formData.append('email', form.email)
      formData.append('phoneNum', form.phoneNum)
      if (form.profilePicture) formData.append('profilePicture', form.profilePicture)

      await api.put(`/users/${userId}`, formData)
      alert('Profile updated')
      navigate(-1)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className='p-6 text-gray-600'>Loading profile...</div>

  return (
    <div className='min-h-screen'>
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Edit Profile</h1>
      </div>

      <main className='max-w-md mx-auto px-4 py-6'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='flex flex-col items-center'>
            <div className='relative w-28 h-28 md:w-32 md:h-32'>
            <label htmlFor='profilePicture' className='block w-full h-full rounded-full border-2 overflow-hidden cursor-pointer bg-gray-200'>
              {previewUrl ? (
                <img src={previewUrl} alt='preview' className='h-full w-full object-cover' />
              ) : (
                <div className='text-gray-400 dark:text-gray-600'>Upload</div>
              )}
              <input id='profilePicture' name='profilePicture' type='file' accept='image/*' onChange={update} className='hidden' />
            </label>
            <div className='absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full shadow-lg'>
              <CameraIcon className='w-6 h-6 text-white' />
            </div>
            </div>
            {errors.profilePicture && <p className='text-sm text-red-600 mt-2'>{errors.profilePicture}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Full name</label>
            <input name='name' value={form.name} onChange={update} className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400' />
            {errors.name && <p className='text-sm text-red-600 mt-1'>{errors.name}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Username</label>
            <input name='userName' value={form.userName} onChange={update} onBlur={checkUsername} className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400' />
            {usernameAvailable === true && <p className='text-sm text-emerald-600 mt-1'>Username available</p>}
            {errors.userName && <p className='text-sm text-red-600 mt-1'>{errors.userName}</p>}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Phone</label>
              <input name='phoneNum' value={form.phoneNum} onChange={update} className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400' />
              {errors.phoneNum && <p className='text-sm text-red-600 mt-1'>{errors.phoneNum}</p>}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Email</label>
              <input name='email' value={form.email} onChange={update} className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400' />
              {errors.email && <p className='text-sm text-red-600 mt-1'>{errors.email}</p>}
            </div>
          </div>

          <button type='button' onClick={() => navigate('/reset-password')} className='w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-xl py-3'>
            Reset Password
          </button>

          <button type='submit' disabled={saving} className='w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600'>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button type='button' onClick={() => navigate(-1)} className='w-full border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 font-semibold rounded-xl py-3'>
            Cancel
          </button>
        </form>
      </main>
    </div>
  )
}
