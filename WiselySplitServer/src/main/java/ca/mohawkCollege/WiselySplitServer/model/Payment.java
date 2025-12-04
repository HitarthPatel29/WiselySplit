package ca.mohawkCollege.WiselySplitServer.model;

import java.sql.Timestamp;

public class Payment {
    private int paymentId;
    private double amount;
    private int payerId;
    private int receiverId;
    private Timestamp paymentDate;
    private String stripePaymentIntentId;
    private String stripeTransferId;
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

    public Payment() {}

    public Payment(int paymentId, double amount, int payerId, int receiverId, Timestamp paymentDate,
                   String stripePaymentIntentId, String stripeTransferId, String status) {
        this.paymentId = paymentId;
        this.amount = amount;
        this.payerId = payerId;
        this.receiverId = receiverId;
        this.paymentDate = paymentDate;
        this.stripePaymentIntentId = stripePaymentIntentId;
        this.stripeTransferId = stripeTransferId;
        this.status = status;
    }

    // Getters and Setters
    public int getPaymentId() { return paymentId; }
    public void setPaymentId(int paymentId) { this.paymentId = paymentId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public int getPayerId() { return payerId; }
    public void setPayerId(int payerId) { this.payerId = payerId; }

    public int getReceiverId() { return receiverId; }
    public void setReceiverId(int receiverId) { this.receiverId = receiverId; }

    public Timestamp getPaymentDate() { return paymentDate; }
    public void setPaymentDate(Timestamp paymentDate) { this.paymentDate = paymentDate; }

    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }

    public String getStripeTransferId() { return stripeTransferId; }
    public void setStripeTransferId(String stripeTransferId) { this.stripeTransferId = stripeTransferId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return "Payment{" +
                "paymentId=" + paymentId +
                ", amount=" + amount +
                ", payerId=" + payerId +
                ", receiverId=" + receiverId +
                ", paymentDate=" + paymentDate +
                ", stripePaymentIntentId='" + stripePaymentIntentId + '\'' +
                ", stripeTransferId='" + stripeTransferId + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}

