// src/components/form/BillSplit.jsx
import React, { useState, useMemo } from 'react'

function BillSplit({ members, onApply, onCancel }) {
    const [itemPrice, setItemPrice] = useState('')
    const [taxIncluded, setTaxIncluded] = useState(true)
    const [selectedIds, setSelectedIds] = useState(
        () => members.map((m) => m.userId) // default: everyone selected
    )

    const [totals, setTotals] = useState(() => {
        const initial = {}
        members.forEach((m) => {
            initial[m.userId] = 0
        })
        return initial
    })

    const handleToggleMember = (userId) => {
        setSelectedIds((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId)
            }
            return [...prev, userId]
        })
    }

    const handleAddItem = () => {
        const price = parseFloat(itemPrice)
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid item price greater than 0.')
            return
        }
        if (!selectedIds.length) {
            alert('Please select at least one participant for this item.')
            return
        }

        const taxRate = taxIncluded ? 0.13 : 0
        const itemTotal = price * (1 + taxRate)
        const perPersonRaw = itemTotal / selectedIds.length

        setTotals((prev) => {
            const next = { ...prev }
            selectedIds.forEach((userId) => {
                const current = next[userId] || 0
                const updated = current + perPersonRaw
                next[userId] = Number(updated.toFixed(2))
            })
            return next
        })

        setItemPrice('')
    }

    const overallTotal = useMemo(() => {
        return Object.values(totals).reduce((sum, value) => sum + (value || 0), 0)
    }, [totals])

    const handleDone = () => {
        const activeMembers = members.filter(
            (m) => (totals[m.userId] || 0) > 0
        )
        if (!activeMembers.length) {
            alert('Please add at least one item before finishing.')
            return
        }

        const splitDetails = activeMembers.map((m) => {
            const amount = Number((totals[m.userId] || 0).toFixed(2))
            return {
                userId: m.userId,
                name: m.name,
                amount,
                portion: 1,
                include: true,
            }
        })

        const totalAmount = splitDetails.reduce((sum, m) => sum + m.amount, 0)
        console.log('BillSplit 81 : splitDetails', splitDetails)
        onApply(splitDetails, totalAmount)
    }

    return ( 
        <div className='flex flex-col gap-4 rounded-xl'>

            {/* Item price */}
            <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Item Price
                </label>
                <div className='flex items-center gap-2'>
                <span className='text-gray-700 dark:text-gray-300 font-semibold'>$</span>
                <input
                    type='number'
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    step='0.01'
                    min='0'
                    placeholder='0.00'
                    className='w-full border border-gray-300 rounded-xl bg-white dark:bg-gray-900 px-3 py-2 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
                />
                </div>
            </div>

            {/* Tax toggle */}
            <div>
                <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Tax
                </span>
                <div className='inline-flex rounded-xl border border-gray-300 overflow-hidden'>
                <button
                    type='button'
                    onClick={() => setTaxIncluded(true)}
                    className={
                    'px-3 py-1 text-sm font-medium ' +
                    (taxIncluded
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200')
                    }
                >
                    Tax (13%)
                </button>
                <button
                    type='button'
                    onClick={() => setTaxIncluded(false)}
                    className={
                    'px-3 py-1 text-sm font-medium border-l border-gray-300 ' +
                    (!taxIncluded
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200')
                    }
                >
                    No Tax
                </button>
                </div>
            </div>

            {/* Participants */}
            <div>
                <p className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Participants for this item
                </p>
                <div className='space-y-1'>
                {members.map((m) => {
                    const checked = selectedIds.includes(m.userId)
                    return (
                    <label
                        key={m.userId}
                        className='flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2'
                    >
                        <div className='flex items-center gap-2'>
                        <input
                            type='checkbox'
                            checked={checked}
                            onChange={() => handleToggleMember(m.userId)}
                            className='w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-400'
                        />
                        <span className='text-sm text-gray-800 dark:text-gray-100'>
                            {m.name}
                        </span>
                        </div>
                    </label>
                    )
                })}
                </div>
            </div>

            {/* Add item button */}
            <div>
                <button
                type='button'
                onClick={handleAddItem}
                className='w-full bg-emerald-500 text-white font-semibold rounded-xl py-2 hover:bg-emerald-600 transition'
                >
                Add This Item To Bill
                </button>
            </div>

            {/* Totals */}
            <div className='mt-4 border-t border-gray-200 pt-4'>
                <h3 className='text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2'>
                Current Totals
                </h3>
                {Object.values(totals).every((v) => !v) ? (
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    No items added yet. Add at least one item to see the split.
                </p>
                ) : (
                <div className='space-y-1'>
                    {members.map((m) => {
                    const amount = totals[m.userId] || 0
                    if (!amount) return null
                    return (
                        <div
                        key={m.userId}
                        className='flex justify-between text-sm text-gray-800 dark:text-gray-100'
                        >
                        <span>{m.name}</span>
                        <span>${amount.toFixed(2)}</span>
                        </div>
                    )
                    })}
                    <div className='flex justify-between text-sm font-semibold text-gray-900 dark:text-gray-50 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2'>
                    <span>Total Bill</span>
                    <span>${overallTotal.toFixed(2)}</span>
                    </div>
                </div>
                )}
            </div>

            {/* Done / Cancel buttons */}
            <div className='flex flex-col gap-2 mt-4'>
                <button
                type='button'
                onClick={handleDone}
                className='w-full bg-emerald-500 text-white font-semibold rounded-xl py-2 hover:bg-emerald-600 transition'
                >
                Done – Use This Split
                </button>
                <button
                type='button'
                onClick={onCancel}
                className='w-full border border-gray-300 text-gray-700 dark:text-gray-200 font-semibold rounded-xl py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition'
                >
                Cancel
                </button>
            </div>
        </div>
    )
}

export default BillSplit;