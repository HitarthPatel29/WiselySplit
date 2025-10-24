// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'
import InviteUser from './pages/InviteUser'
import InviteNotifications from './pages/InviteNotifications'
import FriendsList from './pages/FriendsList'
import IndividualView from './pages/IndividualView'
import AddExpense from './pages/AddExpense'
import ExpenseDetails from './pages/ExpenseDetails'
import EditExpense from './pages/EditExpense'
import GroupsList from './pages/GroupsList'
import EditProfile from './pages/EditProfile'
import CreateGroup from './pages/CreateGroup'
import GroupView from './pages/GroupView'
import AddParticipants from './pages/AddParticipants'

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>  // or spinner
  }

  return token ? children : <Navigate to="/" replace />
} 

function OnboardingRoute({ children }) {
  const { token, loading, firstLogin } = useAuth()

  if (loading) return <div>Loading...</div>

  // If logged in & first time → show onboarding (invite)
  if (token && firstLogin) return children

  // Otherwise skip to dashboard
  if (token && !firstLogin) return <Navigate to='/dashboard' replace />

  // If not logged in
  return <Navigate to='/login' replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected route(s) */}
      <Route path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="/invite"
        element={
          <PrivateRoute>
            <InviteUser />
          </PrivateRoute>
        }
      />
      <Route path="/dashboard/invites"
        element={
          <PrivateRoute>
            <InviteNotifications />
          </PrivateRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <PrivateRoute>
            <FriendsList />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <PrivateRoute>
            <GroupsList />
          </PrivateRoute>
        }
      />
      {/* Temporary redirects for group detail/create until separate pages are implemented */}
      <Route
        path="/groups/:id"
        element={
          <PrivateRoute>
            <GroupView />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/create"
        element={
          <PrivateRoute>
            <CreateGroup />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:id/add-expense"
        element={
          <PrivateRoute>
            <AddExpense />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:id/expenses/:expenseId"
        element={
          <PrivateRoute>
            <ExpenseDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:id/expenses/:expenseId/edit"
        element={
          <PrivateRoute>
            <EditExpense />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:id/add-participants"
        element={
          <PrivateRoute>
            <AddParticipants />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <PrivateRoute>
            <EditProfile />
          </PrivateRoute>
        }
      />
      <Route
        path="/friends/:id"
        element={
          <PrivateRoute>
            <IndividualView />
          </PrivateRoute>
        }
      />
      <Route
        path="/friends/:id/add-expense"
        element={
          <PrivateRoute>
            <AddExpense />
          </PrivateRoute>
        }
      />
      <Route
        path="/friends/:id/expenses/:expenseId"
        element={
          <PrivateRoute>
            <ExpenseDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/friends/:id/expenses/:expenseId/edit"
        element={
          <PrivateRoute>
            <EditExpense />
          </PrivateRoute>
        }
      />

    </Routes>
  )
}