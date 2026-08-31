package ca.mohawk_college.wiselysplit_server.models;

import java.sql.Timestamp;

public class Payment {
    private long paymentId;
    private double amount;
    private long payerId;
    private long receiverId;
    private Timestamp paymentDate;
    private String stripePaymentIntentId;
    private String stripeTransferId;
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

    public Payment() {}

    public Payment(long paymentId, double amount, long payerId, long receiverId, Timestamp paymentDate,
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
    public long getPaymentId() { return paymentId; }
    public void setPaymentId(long paymentId) { this.paymentId = paymentId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public long getPayerId() { return payerId; }
    public void setPayerId(long payerId) { this.payerId = payerId; }

    public long getReceiverId() { return receiverId; }
    public void setReceiverId(long receiverId) { this.receiverId = receiverId; }

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

