package ca.mohawkCollege.wiselySplitServer.jpa.entities;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.sql.Timestamp;
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Payments")

public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PaymentID", columnDefinition = "INT")
    private Long paymentId;

    @Column(name = "Amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.DETACH)
    @JoinColumn(name = "PayerID", nullable = false)
    private User payer;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.DETACH)
    @JoinColumn(name = "ReceiverID", nullable = false)
    private User receiver;

    @Column(name = "PaymentDate", columnDefinition = "DATE", nullable = false)
    private Timestamp paymentDate;

    @Column(name = "StripePaymentIntentId", columnDefinition = "VARCHAR", nullable = false)
    private String stripePaymentIntentId;

    @Column(name = "StripeTransferId", columnDefinition = "VARCHAR", nullable = true)
    private String stripeTransferId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status;
}

