package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private StripeService stripeService;

    @Autowired
    private UserDAO userDAO;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    /**
     * Create Stripe Connect account for a user (recipient)
     * POST /api/payments/connect/create
     */
    @PostMapping("/connect/create")
    public ResponseEntity<?> createConnectAccount(@RequestBody Map<String, Object> payload) {
        try {
            int userId = ((Number) payload.get("userId")).intValue();
            String email = (String) payload.get("email");

            if (email == null || email.isEmpty()) {
                // Fetch email from user
                email = userDAO.findById(userId)
                        .map(user -> user.getEmail())
                        .orElseThrow(() -> new RuntimeException("User not found"));
            }

            Map<String, Object> result = stripeService.createConnectAccount(userId, email);
            return ResponseEntity.ok(result);
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create Stripe Connect account: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create Payment Intent for UserA to pay UserB
     * POST /api/payments/intent/create
     * Creates PaymentIntent first, then creates database record
     */
    @PostMapping("/intent/create")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> payload) {
        try {
            // No longer need paymentId - we'll create it after PaymentIntent
            double amount = ((Number) payload.get("amount")).doubleValue();
            int payerId = ((Number) payload.get("payerId")).intValue();
            int receiverId = ((Number) payload.get("receiverId")).intValue();

            // Get receiver's Stripe account ID
            String receiverStripeAccountId = userDAO.getStripeAccountId(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver does not have a Stripe Connect account"));

            Map<String, Object> result = stripeService.createPaymentIntent(
                    amount, payerId, receiverId, receiverStripeAccountId
            );

            return ResponseEntity.ok(result);
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create payment intent: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Confirm Payment Intent
     * POST /api/payments/intent/confirm
     */
    @PostMapping("/intent/confirm")
    public ResponseEntity<?> confirmPaymentIntent(@RequestBody Map<String, Object> payload) {
        try {
            String paymentIntentId = (String) payload.get("paymentIntentId");

            Map<String, Object> result = stripeService.confirmPaymentIntent(paymentIntentId);
            return ResponseEntity.ok(result);
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to confirm payment intent: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get payment status
     * GET /api/payments/{paymentId}/status
     */
    @GetMapping("/{paymentId}/status")
    public ResponseEntity<?> getPaymentStatus(@PathVariable int paymentId) {
        try {
            Map<String, Object> result = stripeService.getPaymentStatus(paymentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Stripe Webhook endpoint
     * POST /api/payments/webhook
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Webhook secret not configured"));
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Webhook signature verification failed"));
        }

        try {
            stripeService.handleWebhookEvent(event);
            return ResponseEntity.ok(Map.of("received", true));
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process webhook: " + e.getMessage()));
        }
    }
}

