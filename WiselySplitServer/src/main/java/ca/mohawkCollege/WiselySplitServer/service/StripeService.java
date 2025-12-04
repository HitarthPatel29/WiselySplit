package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.PaymentDAO;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.param.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.secret_key}")
    private String stripeSecretKey;

    @Value("${frontend.hosting_url}")
    private String hostingURL;

    @Autowired
    private PaymentDAO paymentDAO;

    @Autowired
    private UserDAO userDAO;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    /**
     * Create a Stripe Connect account for a user (recipient)
     * Returns the account link for onboarding
     */
    public Map<String, Object> createConnectAccount(int userId, String email) throws StripeException {
        AccountCreateParams params = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.EXPRESS)
                .setCountry("US") // Change to your default country
                .setEmail(email)
                .setCapabilities(
                        AccountCreateParams.Capabilities.builder()
                                .setCardPayments(
                                        AccountCreateParams.Capabilities.CardPayments.builder()
                                                .setRequested(true)
                                                .build()
                                )
                                .setTransfers(
                                        AccountCreateParams.Capabilities.Transfers.builder()
                                                .setRequested(true)
                                                .build()
                                )
                                .build()
                )
                .build();

        Account account = Account.create(params);

        // Update user with Stripe account ID
        userDAO.updateStripeAccountId(userId, account.getId());

        // Create account link for onboarding
        AccountLinkCreateParams linkParams = AccountLinkCreateParams.builder()
                .setAccount(account.getId())
                .setRefreshUrl(hostingURL+"/stripe/connect/refresh") // Update with your frontend URL
                .setReturnUrl(hostingURL+"/stripe/connect/return") // Update with your frontend URL
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();

        AccountLink accountLink = AccountLink.create(linkParams);

        return Map.of(
                "accountId", account.getId(),
                "onboardingUrl", accountLink.getUrl(),
                "message", "Stripe Connect account created successfully"
        );
    }

    /**
     * Create a Payment Intent for UserA to pay UserB
     * This creates the PaymentIntent first, then creates the database record
     */
    public Map<String, Object> createPaymentIntent(
            double amount,
            int payerId,
            int receiverId,
            String receiverStripeAccountId
    ) throws StripeException {
        if (receiverStripeAccountId == null || receiverStripeAccountId.isEmpty()) {
            throw new RuntimeException("Receiver does not have a Stripe Connect account. Please set up Stripe Connect first.");
        }

        // Convert amount to cents (Stripe uses smallest currency unit)
        long amountInCents = (long) (amount * 100);

        // Create PaymentIntent first (without paymentId in metadata yet)
        // Use on_behalf_of to allow cross-region payments (settles in connected account's region)
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("cad")
                .addPaymentMethodType("card")
                .setOnBehalfOf(receiverStripeAccountId) // Required for cross-region destination charges
                .setTransferData(
                        PaymentIntentCreateParams.TransferData.builder()
                                .setDestination(receiverStripeAccountId)
                                .build()
                )
                .putMetadata("payerId", String.valueOf(payerId))
                .putMetadata("receiverId", String.valueOf(receiverId))
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        String paymentIntentId = paymentIntent.getId();

        // Now create the database record with the PaymentIntent ID
        Integer paymentId = paymentDAO.addPayment(
                amount,
                payerId,
                receiverId,
                paymentIntentId,  // We have this now!
                null,              // Transfer ID will come later via webhook
                "PROCESSING"
        );

        // Update PaymentIntent metadata with the paymentId we just created
        PaymentIntentUpdateParams updateParams = PaymentIntentUpdateParams.builder()
                .putMetadata("paymentId", String.valueOf(paymentId))
                .build();
        paymentIntent.update(updateParams);

        return Map.of(
                "paymentIntentId", paymentIntentId,
                "clientSecret", paymentIntent.getClientSecret(),
                "paymentId", paymentId,  // Return paymentId to frontend
                "status", paymentIntent.getStatus(),
                "message", "Payment Intent created successfully"
        );
    }

    /**
     * Confirm a Payment Intent (after frontend collects payment method)
     */
    public Map<String, Object> confirmPaymentIntent(String paymentIntentId) throws StripeException {
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

        PaymentIntentConfirmParams params = PaymentIntentConfirmParams.builder()
                .build();

        PaymentIntent confirmedIntent = paymentIntent.confirm(params);

        // Update payment status based on Payment Intent status
        String status = mapStripeStatusToPaymentStatus(confirmedIntent.getStatus());
        paymentDAO.findPaymentByStripePaymentIntentId(paymentIntentId)
                .ifPresent(payment -> {
                    paymentDAO.updatePayment(
                            ((Number) payment.get("paymentId")).intValue(),
                            paymentIntentId,
                            null,
                            status
                    );
                });

        return Map.of(
                "paymentIntentId", confirmedIntent.getId(),
                "status", confirmedIntent.getStatus(),
                "message", "Payment Intent confirmed"
        );
    }

    /**
     * Handle Stripe webhook events
     */
    @Transactional
    public void handleWebhookEvent(Event event) throws StripeException {
        switch (event.getType()) {
            case "payment_intent.succeeded":
                handlePaymentIntentSucceeded(event);
                break;
            case "payment_intent.payment_failed":
                handlePaymentIntentFailed(event);
                break;
            case "transfer.created":
                handleTransferCreated(event);
                break;
            case "transfer.paid":
                handleTransferPaid(event);
                break;
            default:
                // Log unhandled event types
                System.out.println("Unhandled event type: " + event.getType());
        }
    }

    private void handlePaymentIntentSucceeded(Event event) throws StripeException {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject().orElse(null);

        if (paymentIntent == null) {
            System.err.println("Warning: Could not deserialize PaymentIntent from event " + event.getId());
            return;
        }

        String paymentIntentId = paymentIntent.getId();
        String status = "COMPLETED";

        paymentDAO.findPaymentByStripePaymentIntentId(paymentIntentId)
                .ifPresent(payment -> {
                    paymentDAO.updatePayment(
                            ((Number) payment.get("paymentId")).intValue(),
                            paymentIntentId,
                            null,
                            status
                    );
                });
    }

    private void handlePaymentIntentFailed(Event event) throws StripeException {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject().orElse(null);

        if (paymentIntent == null) {
            System.err.println("Warning: Could not deserialize PaymentIntent from event " + event.getId());
            return;
        }

        String paymentIntentId = paymentIntent.getId();
        String status = "FAILED";

        paymentDAO.findPaymentByStripePaymentIntentId(paymentIntentId)
                .ifPresent(payment -> {
                    paymentDAO.updatePayment(
                            ((Number) payment.get("paymentId")).intValue(),
                            paymentIntentId,
                            null,
                            status
                    );
                });
    }

    private void handleTransferCreated(Event event) throws StripeException {
        Transfer transfer = (Transfer) event.getDataObjectDeserializer()
                .getObject().orElse(null);

        if (transfer == null) {
            System.err.println("Warning: Could not deserialize Transfer from event " + event.getId());
            return;
        }

        String transferId = transfer.getId();
        String paymentIntentId = transfer.getSourceTransaction();

        if (paymentIntentId != null) {
            paymentDAO.findPaymentByStripePaymentIntentId(paymentIntentId)
                    .ifPresent(payment -> {
                        paymentDAO.updatePayment(
                                ((Number) payment.get("paymentId")).intValue(),
                                paymentIntentId,
                                transferId,
                                payment.get("status").toString()
                        );
                    });
        }
    }

    private void handleTransferPaid(Event event) throws StripeException {
        Transfer transfer = (Transfer) event.getDataObjectDeserializer()
                .getObject().orElse(null);

        if (transfer == null) {
            System.err.println("Warning: Could not deserialize Transfer from event " + event.getId());
            return;
        }

        String transferId = transfer.getId();
        String paymentIntentId = transfer.getSourceTransaction();

        if (paymentIntentId != null) {
            paymentDAO.findPaymentByStripePaymentIntentId(paymentIntentId)
                    .ifPresent(payment -> {
                        paymentDAO.updatePayment(
                                ((Number) payment.get("paymentId")).intValue(),
                                paymentIntentId,
                                transferId,
                                "COMPLETED"
                        );
                    });
        }
    }

    /**
     * Get payment status
     */
    public Map<String, Object> getPaymentStatus(int paymentId) {
        return paymentDAO.findPaymentById(paymentId)
                .map(payment -> Map.of(
                        "paymentId", payment.get("paymentId"),
                        "status", payment.get("status"),
                        "stripePaymentIntentId", payment.get("stripePaymentIntentId") != null 
                                ? payment.get("stripePaymentIntentId") : "",
                        "stripeTransferId", payment.get("stripeTransferId") != null 
                                ? payment.get("stripeTransferId") : ""
                ))
                .orElse(Map.of("error", "Payment not found"));
    }

    /**
     * Map Stripe Payment Intent status to our payment status
     */
    private String mapStripeStatusToPaymentStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "succeeded" -> "COMPLETED";
            case "processing" -> "PROCESSING";
            case "requires_payment_method", "requires_confirmation", "requires_action" -> "PENDING";
            case "canceled" -> "CANCELLED";
            default -> "FAILED";
        };
    }
}

