import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CameraIcon } from '@heroicons/react/24/solid'
import BackButton from '../../components/IO/BackButton.jsx'

export default function EditGroup() {
  const navigate = useNavigate()
  const { id } = useParams()

  // Mock group + participants
  const [group, setGroup] = useState({
    name: 'Tech Innovators',
    type: 'Work',
    photo: 'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp',
  })

  const [participants] = useState([
    { id: 1, name: 'Aurelia Voss', username: 'aurelia.v', amount: 255, status: 'owed' },
    { id: 2, name: 'Jaxon Lin', username: 'jaxon.l', amount: 200, status: 'owe' },
    { id: 3, name: 'Emery Kline', username: 'emery.k', amount: 350, status: 'owe' },
  ])

  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)

  // Input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setGroup((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) setPhotoFile(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!group.name.trim()) return alert('Group name is required.')
    setLoading(true)
    setTimeout(() => {
      console.log('✅ Updated Group:', {
        id,
        name: group.name,
        type: group.type,
        photo: photoFile ? photoFile.name : 'existing',
      })
      alert('Group changes saved successfully!')
      setLoading(false)
      navigate(`/groups/${id}`)
    }, 800)
  }

  const handleLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      console.log('🚪 User left group:', id)
      alert('You have left the group.')
      navigate('/groups')
    }
  }

  const handleDeleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      console.log('🗑 Deleted group:', id)
      alert('Group deleted successfully.')
      navigate('/groups')
    }
  }

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Edit Group</h1>
      </div>

      <main className='max-w-md md:max-w-2xl mx-auto px-6 py-10'>
        <form onSubmit={handleSave} className='flex flex-col items-center gap-6 rounded-xl'>
          {/* Profile Photo */}
          <div className='relative w-28 h-28 md:w-32 md:h-32'>
            <label
              htmlFor='photo'
              className='block w-full h-full rounded-full border-2 overflow-hidden cursor-pointer bg-gray-200'
            >
              {photoFile ? (
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt='Group'
                  className='w-full h-full object-cover'
                />
              ) : (
                <img
                  src={group.photo}
                  alt='Group'
                  className='w-full h-full object-cover'
                />
              )}
              <input
                id='photo'
                type='file'
                accept='image/*'
                onChange={handlePhotoChange}
                className='hidden'
              />
            </label>

            {/* Camera icon outside label */}
            <div className='absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full shadow-lg'>
              <CameraIcon className='w-6 h-6 text-white' />
            </div>
          </div>

          {/* Group Name */}
          <div className='w-full'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Group Name:</label>
            <input
              type='text'
              name='name'
              value={group.name}
              onChange={handleChange}
              placeholder='Enter group name'
              className='w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
            />
          </div>

          {/* Group Type */}
          <div className='w-full'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Group Type:</label>
            <select
              name='type'
              value={group.type}
              onChange={handleChange}
              className='w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
            >
              <option value='Work'>Work</option>
              <option value='Friends'>Friends</option>
              <option value='Family'>Family</option>
            </select>
          </div>

          {/* Participants */}
          <div className='w-full mt-4'>
            <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>Participants:</h3>
            <div className='space-y-2'>
              {participants.map((p) => (
                <div
                  key={p.id}
                  className='flex items-center justify-between border rounded-xl px-3 py-2'
                >
                  <div className='flex items-center gap-3'>
                    <img
                      src='https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp'
                      alt={p.name}
                      className='w-9 h-9 rounded-full object-cover'
                    />
                    <div>
                      <p className='text-sm font-medium'>{p.name}</p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>@{p.username}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      p.status === 'owed' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {p.status === 'owed'
                      ? `Owes you $${p.amount}`
                      : `You owe $${p.amount}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className='w-full flex flex-col gap-3 mt-6'>
            <button
              type='submit'
              disabled={loading}
              className='w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition disabled:opacity-60'
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type='button'
              onClick={() => navigate(`/groups/${id}`)}
              className='w-full border border-gray-300 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:bg-gray-100 hover:text-gray-900 transition'
            >
              Cancel
            </button>

            <button
              type='button'
              onClick={handleLeaveGroup}
              className='w-full border border-amber-500 text-amber-600 font-semibold rounded-xl py-3 hover:bg-amber-50 transition'
            >
              Leave Group
            </button>

            <button
              type='button'
              onClick={handleDeleteGroup}
              className='w-full border border-red-500 text-red-600 font-semibold rounded-xl py-3 hover:bg-red-50 transition'
            >
              Delete Group
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
