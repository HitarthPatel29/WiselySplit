// src/components/OtpInput.jsx
import React, { useRef } from 'react'

export default function OtpInput({ value, length = 6, onChange }) {
  const inputsRef = useRef([])

  const handleChange = (e, i) => {
    const val = e.target.value.replace(/[^0-9]/g, '') // only digits
    const otpArray = value.split('')
    otpArray[i] = val
    const newOtp = otpArray.join('')
    onChange(newOtp)

    if (val && e.target.nextSibling) {
      e.target.nextSibling.focus()
    }
  }

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !value[i] && e.target.previousSibling) {
      e.target.previousSibling.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    if (!paste) return

    const otpArray = value.split('')
    for (let i = 0; i < paste.length; i++) {
      otpArray[i] = paste[i]
      if (inputsRef.current[i]) {
        inputsRef.current[i].value = paste[i]
      }
    }
    onChange(otpArray.join(''))

    // focus last filled input
    const lastIndex = Math.min(paste.length, length) - 1
    if (inputsRef.current[lastIndex]) {
      inputsRef.current[lastIndex].focus()
    }
  }

  return (
    <div className='flex justify-center gap-2' onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          type='text'
          inputMode='numeric'
          maxLength={1}
          ref={(el) => (inputsRef.current[i] = el)}
          className='w-12 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400'
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  )
}