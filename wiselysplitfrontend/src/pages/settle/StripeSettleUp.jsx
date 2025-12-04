import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Header from '../../components/Header.jsx'
import api from '../../api'
import { formatCurrency } from '../../utils/settleUp.js'

// Initialize Stripe - you'll need to add your Stripe publishable key to .env
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
)

function StripeCheckoutForm({ amount, clientSecret, onSuccess, onError, receiverId }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // First, submit the elements to validate the form
      const { error: submitError } = await elements.submit()
      
      if (submitError) {
        setError(submitError.message)
        setProcessing(false)
        return
      }

      // Then confirm payment with Stripe using PaymentElement
      const { error: confirmError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: import.meta.env.VITE_FRONTEND_URL + '/friends/' + receiverId,
          },
          redirect: 'if_required', // Only redirect if 3D Secure is required
        })

      if (confirmError) {
        setError(confirmError.message)
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess(paymentIntent)
      } else {
        setError('Payment failed. Please try again.')
        setProcessing(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('An error occurred. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full rounded-xl py-3 font-semibold transition ${
          !stripe || processing
            ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {processing ? 'Processing Payment...' : `Pay ${formatCurrency(amount)}`}
      </button>
    </form>
  )
}

export default function StripeSettleUp() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { payload, summary, returnTo } = state || {}
  const [loading, setLoading] = useState(true)
  const [paymentIntentId, setPaymentIntentId] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [receiverId, setReceiverId] = useState(null)
  const [error, setError] = useState(null)
    useEffect(() => {
    const createPaymentIntent = async () => {
      if (!payload) {
        setError('Missing payment information')
        setLoading(false)
        return
      }

      try {
        // Extract receiverId from splitDetails (targetUserId)
        const receiverId =
          payload.receiverId ||
          payload.splitDetails?.[0]?.userId ||
          payload.targetUserId ||
          payload.settlementTargetId

        if (!receiverId) {
          throw new Error('Missing receiver information')
        }
        setReceiverId(receiverId)
        // Create Payment Intent directly (backend will create PaymentIntent first, then DB record)
        const intentRes = await api.post('/payments/intent/create', {
          amount: payload.amount,
          payerId: payload.payerId,
          receiverId: receiverId,
        })

        if (intentRes.data?.clientSecret && intentRes.data?.paymentIntentId && intentRes.data?.paymentId) {
          setClientSecret(intentRes.data.clientSecret)
          setPaymentIntentId(intentRes.data.paymentIntentId)
          setPaymentId(intentRes.data.paymentId)  // Store paymentId from response
        } else {
          throw new Error('Failed to create payment intent')
        }
      } catch (err) {
        console.error('Failed to create payment intent:', err)
        setError(
          err.response?.data?.error ||
            'Failed to initialize payment. Please make sure the recipient has connected their Stripe account.'
        )
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [payload])

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Use the payment ID we stored when creating the payment intent
      // Fallback to metadata if needed
      const finalPaymentId = paymentId || paymentIntent.metadata?.paymentId

      if (!finalPaymentId) {
        throw new Error('Payment ID not found')
      }

      // Create the expense with payment ID
      const expensePayload = {
        ...payload,
        paymentId: typeof finalPaymentId === 'string' ? parseInt(finalPaymentId, 10) : finalPaymentId,
      }

      await api.post('/expenses', expensePayload)
      alert('Payment successful! Settlement recorded.')
      navigate(returnTo || '/dashboard', { replace: true })
    } catch (err) {
      console.error('Failed to record settlement:', err)
      alert(
        err.response?.data?.error ||
          'Payment succeeded but failed to record settlement. Please contact support.'
      )
    }
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
    setError(error.message || 'Payment failed. Please try again.')
  }

  if (!payload) {
    return (
      <div className="min-h-screen">
        <Header title="Stripe Checkout" />
        <main className="mx-auto max-w-lg px-4 py-10 text-center text-gray-600 dark:text-gray-400">
          <p>Missing settlement data. Please start the settle-up process again.</p>
          <button
            className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </main>
      </div>
    )
  }

  const amount = formatCurrency(payload.amount)
  const targetName = summary?.targetName || 'your friend'
  const groupLabel = summary?.shareLabel

  return (
    <div className="min-h-screen">
      <Header title="Stripe Payment" />
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Pay {targetName}
          </h2>
          {groupLabel && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Group: {groupLabel}
            </p>
          )}

          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {amount}
            </p>
          </div>

          {loading ? (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Initializing payment...
              </p>
            </div>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
              <p className="font-semibold">Payment Error</p>
              <p className="mt-2">{error}</p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mt-4 w-full rounded-xl border border-red-300 bg-white py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Go Back
              </button>
            </div>
          ) : clientSecret && paymentIntentId ? (
            <div className="mt-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckoutForm
                  receiverId={receiverId}
                  amount={payload.amount}
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            </div>
          ) : null}

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <p className="font-semibold">Secure Payment</p>
            <p className="mt-1">
              Your payment is processed securely by Stripe. We never store your
              card information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 w-full rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  )
}
