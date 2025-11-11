// src/components/Navbar.jsx

import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-gray-700 text-white p-3 flex gap-4">
      <a href="/dashboard" className="hover:underline">Dashboard</a>
      <a href="/login" className="hover:underline">Login</a>
      <a href="/signup" className="hover:underline">Signup</a>
    </nav>
  );
};

export default Navbar;
