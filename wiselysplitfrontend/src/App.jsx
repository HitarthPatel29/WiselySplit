// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'
import InviteUser from './pages/invite/InviteUser'
import InviteNotifications from './pages/invite/InviteNotifications'
import FriendsList from './pages/friend/FriendsList.jsx'
import IndividualView from './pages/friend/IndividualView.jsx'
import AddExpense from './pages/expense/AddExpense.jsx'
import ExpenseDetails from './pages/expense/ExpenseDetails.jsx'
import EditExpense from './pages/expense/EditExpense.jsx'
import GroupsList from './pages/group/GroupsList.jsx'
import EditProfile from './pages/EditProfile'
import CreateGroup from './pages/group/CreateGroup.jsx'
import GroupView from './pages/group/GroupView.jsx'
import AddParticipants from './pages/group/AddParticipants.jsx'
import EditGroup from './pages/group/EditGroup.jsx'
import PersonalSummary from './pages/personalExpense/PersonalSummary.jsx'
import StripeSettleUp from './pages/settle/StripeSettleUp.jsx'
import SettlementDetails from './pages/settle/SettlementDetails.jsx'
import StripeConnectSetup from './pages/stripe/StripeConnectSetup.jsx'

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
        path="/groups/:id/settlements/:expenseId"
        element={
          <PrivateRoute>
            <SettlementDetails />
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
        path="/groups/:id/edit"
        element={
          <PrivateRoute>
            <EditGroup />
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
        path="/friends/:friendId"
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
        path="/friends/:id/settlements/:expenseId"
        element={
          <PrivateRoute>
            <SettlementDetails />
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
      <Route
        path="/personalSummary"
        element={
          <PrivateRoute>
            <PersonalSummary />
          </PrivateRoute>
        }
      />
      <Route
        path="/personalSummary/expenses/:expenseId"
        element={
          <PrivateRoute>
            <ExpenseDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/personalSummary/settlements/:expenseId"
        element={
          <PrivateRoute>
            <SettlementDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/personalSummary/expenses/:expenseId/edit"
        element={
          <PrivateRoute>
            <EditExpense />
          </PrivateRoute>
        }
      />
      <Route
        path="/settle/stripe-checkout"
        element={
          <PrivateRoute>
            <StripeSettleUp />
          </PrivateRoute>
        }
      />
      <Route
        path="/stripe/connect"
        element={
          <PrivateRoute>
            <StripeConnectSetup />
          </PrivateRoute>
        }
      />

    </Routes>
  )
}
