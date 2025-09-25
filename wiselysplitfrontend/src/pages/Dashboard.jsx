// Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'


export default function Dashboard() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

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
    <div>
      <h2>Dashboard</h2>
      {/* {message && <p>{message}</p>}
      {data && (
        <div>
          <p>Total Owed: {data.totalOwed}</p>
          <p>Total Lent: {data.totalLent}</p>
          <p>Groups: {data.groups.join(', ')}</p>
        </div>
      )} */}
    </div>
  );
}
