// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export default function Dashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  const handleLogout = () => {
    logout()
    navigate('/') // send back to login page
  }
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const res = await api.get('/user/1'); // TODO: use dynamic userId later
  //       setData(res.data);
  //     } catch (err) {
  //       setMessage(err.response?.data?.error || 'Error fetching dashboard data');
  //     }
  //   };
  //   fetchData();
  // }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* 🔑 Logout button */}
      <button
        onClick={handleLogout}
        className="rounded-xl bg-red-500 px-4 py-2 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Logout
      </button>

      {/* 
        🔜 Your API / dashboard data will go here
        Keep all your commented-out lines as they are.
      */}
    </div>
  );
}
