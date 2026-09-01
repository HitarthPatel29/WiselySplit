package ca.mohawk_college.wiselysplit_server.jpa.entities.entry;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.entities.*;
import ca.mohawk_college.wiselysplit_server.jpa.utilities.ExpenseCategoryConverter;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@SuperBuilder
@DiscriminatorValue("expense")
public class Expense extends Entry {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WalletID", nullable = true)
    private Wallet wallet;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseParticipation> participants = new ArrayList<>();

    @Override
    public EntryType getEntryType() { return EntryType.EXPENSE; }
}
