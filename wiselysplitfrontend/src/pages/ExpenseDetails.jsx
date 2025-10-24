// src/pages/ExpenseDetails.jsx
import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import BackButton from '../components/BackButton'

export default function ExpenseDetails() {
  const { id, expenseId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const expense = location.state

  if (!expense)
    return (
      <div className='min-h-screen flex justify-center items-center text-gray-600'>
        Expense not found.
      </div>
    )

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
        console.log('🗑 Deleted expense:', expenseId)
        navigate(`/friends/${id}`)
        if (expense.fromGroup) navigate(`/groups/${id}`)
        else navigate(`/friends/${id}`)
    }
  }

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Expense Details</h1>
      </div>

      <main className='max-w-2xl mx-auto px-4 py-10'>
        <div className='bg-gray-50 border border-gray-200 rounded-xl p-6'>
          <p className='text-xl font-semibold mb-2'>{expense.title}</p>
          <p className='text-gray-600 mb-4'>{expense.type}</p>

          <div className='space-y-2'>
            <p><strong>Date:</strong> {expense.date}</p>
            <p><strong>Amount:</strong> ${expense.amount}</p>
            <p><strong>Paid By:</strong> {expense.payer}</p>

            {expense.shareWithType === 'group' && expense.splitDetails ? (
              <>
                <p><strong>Shared With:</strong> {expense.shareWith}</p>
                <div className='mt-3 border-t pt-2'>
                  <p className='font-medium mb-2'>Split Details:</p>
                  {expense.splitDetails.map((m, i) => (
                    <div key={i} className='flex justify-between text-sm'>
                      <span>{m.name}</span>
                      <span>${m.amount}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p><strong>Who Owes:</strong> {expense.owes}</p>
            )}
          </div>

          <div className='flex flex-col sm:flex-row gap-3 mt-6'>
            <button
              onClick={() =>
                navigate(`/friends/${id}/expenses/${expenseId}/edit`, { state: expense })
              }
              className='flex-1 bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition'
            >
              Edit Expense
            </button>
            <button
              onClick={handleDelete}
              className='flex-1 border border-red-400 text-red-600 font-semibold rounded-xl py-3 hover:bg-red-50 transition'
            >
              Delete Expense
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}