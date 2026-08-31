package ca.mohawk_college.wiselysplit_server.jpa.entities;

import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "ExpenseParticipation")
public class ExpenseParticipation {
    @EmbeddedId
    private ExpenseParticipationId id = new ExpenseParticipationId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("expenseId")
    @JoinColumn(name = "ExpenseID", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "Contribution", precision = 10, scale = 2)
    private BigDecimal contribution;

    @Column(name = "ContributionPortion", precision = 10, scale = 1)
    private BigDecimal contributionPortion;
}
