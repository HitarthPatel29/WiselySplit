package ca.mohawkCollege.wiselySplitServer.jpa.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExpenseParticipation {
    @EmbeddedId
    private ExpenseParticipationId id = new ExpenseParticipationId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("ExpenseId")
    @JoinColumn(name = "ExpenseID", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("UserId")
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "Contribution", precision = 10, scale = 2)
    private BigDecimal contribution;

    @Column(name = "ContributionPortion", precision = 10, scale = 1)
    private BigDecimal contributionPortion;
}
