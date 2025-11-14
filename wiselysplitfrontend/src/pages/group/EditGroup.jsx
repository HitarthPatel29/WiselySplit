import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CameraIcon } from '@heroicons/react/24/solid'
import BackButton from '../../components/IO/BackButton.jsx'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'
import ListItemCard from '../../components/ListItem/ListItemCard.jsx'

export default function EditGroup() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId } = useAuth()

  const [group, setGroup] = useState({
    name: '',
    type: '',
    photo: '',
  })

  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [canLeave, setCanLeave] = useState(true)

  /* Fetch group details from backend */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/groups/${id}/details`, {
          params: { userId },
        })
        const data = res.data || {}

        // Backend: { group, participants }
        const g = data.group || {}

        setGroup({
          name: g.name || '',
          type: g.type || 'Work',
          photo: g.photo || g.ProfilePicture || '',
        })

        // Participants with balance
        const p = data.participants || []
        setParticipants(p)

        // Compute if user can leave the group
        const bad = p.some((m) => m.amount !== 0)
        setCanLeave(!bad)
      } catch (err) {
        console.error('Failed to load group details:', err)
      }
    }
    load()
  }, [id, userId])

  /* Change handlers */
  const handleChange = (e) => {
    setGroup((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) setPhotoFile(file)
  }

  /* Save: PUT /api/groups/{id} */
  const handleSave = async (e) => {
    e.preventDefault()
    if (!group.name.trim()) return alert('Group name is required.')

    setLoading(true)

    try {
      const form = new FormData()
      form.append('name', group.name)
      form.append('type', group.type)
      if (photoFile !== null) {
        form.append('photo', photoFile)
      }

      await api.put(`/groups/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      alert('Group updated successfully!')
      navigate(`/groups/${id}`)
    } catch (err) {
      console.error(err)
      alert('Failed to update group.')
    } finally {
      setLoading(false)
    }
  }
  /* Leave group */
  const handleLeaveGroup = async () => {
    if (!canLeave) return alert('You must settle all balances before leaving.')
      if (!window.confirm('Are you sure you want to leave this group?')) return

    try {
      await api.post(`/groups/${id}/leave`, null, {
        params: { userId },
      })

      alert('Left group.')
      navigate('/groups')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to leave group.')
    }
  }

  /* Delete group */
  const handleDeleteGroup = async () => {
    if (!window.confirm('Delete group? This is permanent.')) return
    try {
      await api.delete(`/groups/${id}`, {
        params: { userId },
      })

      alert('Group deleted.')
      navigate('/groups')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to delete group.')
    }
  }

  /* Render */
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

            <div className='w-full mt-4'>
              <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                Participants:
              </h3>

              <div className='space-y-2'>
                {participants.map((p) => {
                  return (
                    <ListItemCard
                      key={p.userId || p.id}
                      avatar={p.avatarUrl}
                      name={p.name}
                      groupType={`@${p.username}`}
                      amount={p.amount}
                      status={p.status || 'neutral'}
                      onClick={() => {}}
                    />
                  )
                })}
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
