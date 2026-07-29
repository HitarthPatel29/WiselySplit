package ca.mohawkCollege.wiselySplitServer.jpa.entities;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.EntryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "Expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ExpenseID", columnDefinition = "BIGINT")
    private Long expenseId;

    @Column(name = "Amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "ExpenseTitle", columnDefinition = "VARCHAR")
    private String expenseTitle;

    @Column(name = "ExpenseDate", columnDefinition = "DATE")
    private LocalDate expenseDate;

    @Column(name = "ExpenseType", columnDefinition = "VARCHAR")
    private String expenseType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PayerID", nullable = false)
    private User payer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GroupID", nullable = true)
    private ExpenseGroup expenseGroup;

    @Column(name = "isSettleUp", columnDefinition = "TINYINT")
    private Boolean isSettleUp;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PaymentID", nullable = true)
    private Payment payment;

    @Column(name = "IsPersonal", columnDefinition = "TINYINT")
    private Boolean isPersonal;

    @Enumerated(EnumType.STRING)
    @Column(name = "EntryKind", nullable = false)
    private EntryType entryType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WalletID", nullable = true)
    private Wallet Wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ToWalletID", nullable = true)
    private Wallet ToWallet;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseParticipation> participations = new ArrayList<>();
}
