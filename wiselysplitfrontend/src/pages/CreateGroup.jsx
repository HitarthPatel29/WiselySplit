import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CameraIcon } from '@heroicons/react/24/solid'
import BackButton from '../components/BackButton'

export default function CreateGroup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: '',
    photo: null
  })

  // handle field change
  const handleChange = (e) => {
    const { name, type, value, files } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }))
  }

  // simple validation
  const isAlphanumeric = (str) => /^[a-zA-Z0-9\s]+$/.test(str)
  const validate = () => {
    if (!form.name.trim()) return 'Group name is required.'
    if (!isAlphanumeric(form.name)) return 'Group name must be alphanumeric.'
    if (!form.type) return 'Please select a group type.'
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const error = validate()
    if (error) return alert(error)

    setLoading(true)
    setTimeout(() => {
      console.log('✅ Created Group:', {
        name: form.name,
        type: form.type,
        photo: form.photo ? form.photo.name : 'default'
      })
      alert(`Group "${form.name}" created successfully!`)
      setLoading(false)
      navigate('/groups')
    }, 800)
  }

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Create a Group</h1>
      </div>

      {/* Main Form */}
      <main className='max-w-md md:max-w-2xl mx-auto px-6 py-10'>
        <form
          onSubmit={handleSubmit}
          className='flex flex-col items-center gap-6 bg-white rounded-xl'
        >
          {/* Profile photo upload */}
          <label
            htmlFor='photo'
            className='relative w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-100'
          >
            {form.photo ? (
              <img
                src={URL.createObjectURL(form.photo)}
                alt='Group preview'
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex flex-col items-center text-gray-600'>
                <CameraIcon className='h-7 w-7 text-gray-500' />
                <span className='text-xs mt-1'>Select photo</span>
              </div>
            )}
            <input
              id='photo'
              name='photo'
              type='file'
              accept='image/*'
              onChange={handleChange}
              className='hidden'
            />
          </label>

          {/* Group Name */}
          <div className='w-full'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Group Name:
            </label>
            <input
              type='text'
              name='name'
              value={form.name}
              onChange={handleChange}
              placeholder='e.g. Tech Innovators'
              className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
              required
            />
          </div>

          {/* Group Type */}
          <div className='w-full'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Group Type:
            </label>
            <select
              name='type'
              value={form.type}
              onChange={handleChange}
              required
              className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
            >
              <option value=''>Select Type</option>
              <option value='Work'>Work</option>
              <option value='Friends'>Friends</option>
              <option value='Family'>Family</option>
            </select>
          </div>

          {/* Buttons */}
          <div className='w-full flex flex-col gap-3 mt-4'>
            <button
              type='submit'
              disabled={loading}
              className='w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition disabled:opacity-60'
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type='button'
              onClick={() => navigate('/groups')}
              className='w-full border border-gray-300 text-gray-700 font-semibold rounded-xl py-3 hover:bg-gray-100 transition'
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}