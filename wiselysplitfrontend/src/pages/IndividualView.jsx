import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import ExpenseItemCard from '../components/ExpenseItemCard'

export default function IndividualView() {
  const navigate = useNavigate()
  const { id } = useParams()

  const friend = {
    name: 'Aurelia Voss',
    amountOwed: 10,
    youOwe: true,
    avatar: 'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp',
  }

  const expenses = [
    {
      id: 1,
      date: 'Mar 01',
      title: 'Tech Innovators',
      subtitle: 'Shared Group',
      amount: 45,
      type: 'lent',
      highlight: true,
    },
    {
      id: 2,
      date: 'Mar 02',
      title: 'Lunch with client',
      subtitle: 'You owe Aurelia Voss',
      amount: 25,
      type: 'owe',
    },
  ]

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Individual View</h1>
      </div>

      <section className='max-w-3xl mx-auto px-4 py-6'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          <img
            src={friend.avatar}
            alt={friend.name}
            className='w-24 h-24 rounded-full object-cover border'
          />
          <div className='flex-1 text-center sm:text-left'>
            <h2 className='text-2xl font-semibold'>{friend.name}</h2>
            <p
              className={`mt-2 text-lg font-medium ${
                friend.youOwe ? 'text-red-500' : 'text-emerald-600'
              }`}
            >
              {friend.youOwe
                ? `You owe ${friend.name} $${friend.amountOwed}`
                : `${friend.name} owes you $${friend.amountOwed}`}
            </p>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-3 justify-center mt-4'>
          <button
            onClick={() => navigate(`/friends/${id}/add-expense`)}
            className='sm:w-full bg-emerald-100 text-emerald-700 font-semibold rounded-xl py-3 hover:bg-emerald-200'
          >
            + Add Expense
          </button>
          <button className='sm:w-52 bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600'>
            Settle Up
          </button>
        </div>
      </section>

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
                navigate(`/friends/${id}/expenses/${ex.id}`, { state: ex })
              }
            />
          ))}
        </div>
      </main>
    </div>
  )
}