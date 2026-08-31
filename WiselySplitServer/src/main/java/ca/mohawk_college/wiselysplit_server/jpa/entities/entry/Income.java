package ca.mohawk_college.wiselysplit_server.jpa.entities.entry;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.IncomeCategory;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.utilities.IncomeCategoryConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@SuperBuilder
@DiscriminatorValue("income")
public class Income extends Entry {

    /** Stored as display name (e.g. "Food & Dining") via {@link IncomeCategoryConverter}. */
    @Convert(converter = IncomeCategoryConverter.class)
    @Column(name = "ExpenseType", columnDefinition = "VARCHAR")
    private IncomeCategory incomeCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PayerID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WalletID", nullable = true) // wallet receiving the INCOME
    private Wallet wallet;

    @Override
    public EntryType getEntryType() { return EntryType.INCOME; }
}