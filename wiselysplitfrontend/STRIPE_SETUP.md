# Stripe Connect Frontend Setup

## Environment Variables

Add the following to your `.env` file:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Get your publishable key from your Stripe Dashboard.

## Features Implemented

### 1. Stripe Connect Account Setup
- **Route**: `/stripe/connect`
- **Component**: `src/pages/stripe/StripeConnectSetup.jsx`
- Users can connect their Stripe account to receive payments
- Shows connection status
- Redirects to Stripe onboarding flow

### 2. Stripe Payment Flow
- **Route**: `/settle/stripe-checkout`
- **Component**: `src/pages/settle/StripeSettleUp.jsx`
- Integrated Stripe.js for secure card payments
- Creates Payment Intent on backend
- Handles payment confirmation
- Records settlement after successful payment

### 3. Profile Integration
- **Component**: `src/pages/EditProfile.jsx`
- Shows Stripe Connect status
- Link to connect/manage Stripe account

### 4. Settlement Flow
- Updated settlement modals to support Stripe payments
- Works in both Individual View and Group View
- Checks for Stripe account before allowing Stripe payments (handled by backend)

## Payment Flow

1. User clicks "Pay Using Stripe" in settlement modal
2. Frontend navigates to `/settle/stripe-checkout` with payment details
3. Backend creates Payment Intent and returns `clientSecret`
4. User enters card details using Stripe Elements
5. Payment is confirmed via Stripe.js
6. On success, settlement is recorded with payment ID
7. User is redirected back to previous page

## Dependencies Added

- `@stripe/stripe-js`: ^2.4.0
- `@stripe/react-stripe-js`: ^2.4.0

## Notes

- Make sure to set `VITE_STRIPE_PUBLISHABLE_KEY` in your `.env` file
- The backend will handle checking if recipients have Stripe accounts
- Webhook handling is done on the backend to update payment status

