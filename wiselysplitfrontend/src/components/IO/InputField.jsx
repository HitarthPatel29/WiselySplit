// src/components/IO/InputField.jsx

import React from 'react';

const InputField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  id,
  required = false,
  error,
  ariaDescribedBy,
  ...props 
}) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="mb-4">
      <label 
        htmlFor={inputId}
        className="block mb-1 font-medium"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
          error 
            ? 'border-red-500 dark:border-red-400' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      />
      {error && (
        <p 
          id={errorId}
          role="alert"
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
