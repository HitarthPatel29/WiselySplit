// src/components/IO/InputField.jsx

import React from 'react';

const InputField = ({ label, type = 'text', value, onChange, ...props }) => (
  <div className="mb-4">
    <label className="block mb-1 font-medium">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
      {...props}
    />
  </div>
);

export default InputField;
