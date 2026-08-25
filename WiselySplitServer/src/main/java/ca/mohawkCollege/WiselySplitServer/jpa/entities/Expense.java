package ca.mohawkCollege.wiselySplitServer.jpa.entities;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.EntryType;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.ExpenseCategory;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.ExpenseCategoryConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
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
@Builder
@Table(name = "Expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ExpenseID", columnDefinition = "BIGINT")
    private Long expenseId;

    @Column(name = "Amount", precision = 10, scale = 2)
    @PositiveOrZero(message = "Quantity cannot be negative")
    private BigDecimal amount;

    @Column(name = "ExpenseTitle", columnDefinition = "VARCHAR")
    private String expenseTitle;

    @Column(name = "ExpenseDate", columnDefinition = "DATE")
    private LocalDate expenseDate;

    /** Stored as display name (e.g. "Food & Dining") via {@link ExpenseCategoryConverter}. */
    @Convert(converter = ExpenseCategoryConverter.class)
    @Column(name = "ExpenseType", columnDefinition = "VARCHAR")
    private ExpenseCategory expenseCategory;

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
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ToWalletID", nullable = true)
    private Wallet ToWallet;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseParticipation> participants = new ArrayList<>();
}
