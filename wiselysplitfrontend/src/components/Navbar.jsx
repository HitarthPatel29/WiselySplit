// src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav 
      className="bg-gray-700 text-white p-3 flex gap-4"
      role="navigation"
      aria-label="Main navigation"
    >
      <Link 
        to="/dashboard" 
        className="hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:rounded"
      >
        Dashboard
      </Link>
      <Link 
        to="/login" 
        className="hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:rounded"
      >
        Login
      </Link>
      <Link 
        to="/signup" 
        className="hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:rounded"
      >
        Signup
      </Link>
    </nav>
  );
};

export default Navbar;
