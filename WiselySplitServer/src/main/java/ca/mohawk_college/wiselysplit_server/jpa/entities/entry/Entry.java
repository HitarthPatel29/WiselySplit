package ca.mohawk_college.wiselysplit_server.jpa.entities.entry;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@SuperBuilder
@Table(name = "Expenses")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "EntryKind", discriminatorType = DiscriminatorType.STRING, length = 10)
public abstract class Entry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ExpenseID", columnDefinition = "BIGINT")
    @EqualsAndHashCode.Include
    private Long entryId;

    @Column(name = "Amount", precision = 10, scale = 2)
    @PositiveOrZero(message = "Quantity cannot be negative")
    private BigDecimal amount;

    @Column(name = "ExpenseTitle", columnDefinition = "VARCHAR")
    private String title;

    @Column(name = "ExpenseDate", columnDefinition = "DATE")
    private LocalDate date;

    public abstract EntryType getEntryType();
}