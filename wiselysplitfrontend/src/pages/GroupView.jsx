import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import ExpenseItemCard from '../components/ExpenseItemCard'

export default function GroupView() {
  const navigate = useNavigate()
  const { id } = useParams()

  // --- Mock group data (will later come from backend) ---
  const group = {
    id,
    name: 'Tech Innovators',
    avatar:
      'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp',
    overallStanding: {
      text: 'You are Owed $255',
      color: 'text-emerald-600',
    },
    membersStanding: [
      { id: 1, text: 'Jay.M owes you $255', color: 'text-emerald-600' },
      { id: 2, text: 'Tirth owes Jay.M $25', color: 'text-gray-800' },
      { id: 3, text: 'You owe Tirth $10', color: 'text-red-500' },
    ],
  }

  const expenses = [
    {
      id: 1,
      date: 'Mar 01',
      title: 'Lunch with client',
      subtitle: 'You lent to Tirth',
      amount: 45,
      type: 'lent',
      highlight: true,
    },
    {
      id: 2,
      date: 'Mar 02',
      title: 'Lunch with client',
      subtitle: 'You owe Jay.M',
      amount: 25,
      type: 'owe',
    },
    {
      id: 3,
      date: 'Mar 04',
      title: 'Lunch with client',
      subtitle: 'You lent to Jay.M',
      amount: 100,
      type: 'lent',
    },
    {
      id: 4,
      date: 'Mar 07',
      title: 'Lunch with client',
      subtitle: 'You owe to Tirth',
      amount: 15,
      type: 'owe',
    },
    {
      id: 5,
      date: 'Mar 10',
      title: 'Lunch with client',
      subtitle: 'You lent to Tirth',
      amount: 150,
      type: 'lent',
    },
  ]

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Group View</h1>
      </div>

      {/* Group Info */}
      <section className='max-w-3xl mx-auto px-4 py-6'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          <img
            src={group.avatar}
            alt={group.name}
            className='w-24 h-24 rounded-full object-cover border'
          />
          <div className='flex-1 text-center sm:text-left'>
            <h2 className='text-2xl font-semibold'>{group.name}</h2>
            <p className={`mt-1 font-medium ${group.overallStanding.color}`}>
              Your Overall Standing: {group.overallStanding.text}
            </p>

            <div className='mt-2 text-sm space-y-1'>
              {group.membersStanding.map((m) => (
                <p key={m.id} className={m.color}>
                  {m.text}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3 justify-center mt-5'>
            <button
                onClick={() => navigate(`/groups/${id}/add-expense`, { state: { fromGroup: true } })}
                className='sm:w-full bg-emerald-100 text-emerald-700 font-semibold rounded-xl py-3 hover:bg-emerald-200 transition'
                >
                + Add Expense
            </button>
            <button
                onClick={() => navigate(`/groups/${id}/add-participants`)}
                className='sm:w-full bg-emerald-100 text-emerald-700 font-semibold rounded-xl py-3 hover:bg-emerald-200 transition'
                >
                + Add Participants
            </button>
            <button
                onClick={() => navigate(`/groups/${id}/edit`)}
                className='sm:w-16 bg-emerald-500 text-white rounded-xl py-3 hover:bg-emerald-600 flex items-center justify-center transition'
            >
                ⚙
            </button>
        </div>
      </section>

      {/* Expense List */}
      <main className='max-w-3xl mx-auto px-4 pb-10'>
        <h3 className='text-lg font-semibold mb-4'>Expenses</h3>
        <div className='flex flex-col gap-3'>
          {expenses.map((ex) => (
            <ExpenseItemCard
                key={ex.id}
                date={ex.date}
                title={ex.title}
                subtitle={ex.subtitle}
                amount={ex.amount}
                type={ex.type}
                highlight={ex.highlight}
                onClick={() =>
                    navigate(`/groups/${id}/expenses/${ex.id}`, { state: { ...ex, fromGroup: true } })
                }
            />
          ))}
        </div>
      </main>
    </div>
  )
}