package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupSummaryResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseGroupRepo extends JpaRepository<ExpenseGroup, Long> {

    @Query("""
            SELECT CASE WHEN COUNT(g) > 0 THEN true ELSE false END
            FROM ExpenseGroup g JOIN g.participants p
            WHERE g.groupId = ?1 AND p.userId = ?2
            """)
    boolean existsByGroupIdAndParticipantUserId(Long groupId, Long userId);

    @Query("select e from ExpenseGroup e inner join e.participants participants where participants.userId = ?1")
    List<ExpenseGroup> findAllByUserId(Long userId);

    @Query("""
    SELECT new ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupSummaryResponseDTO(
        eg.groupId,
        eg.groupName,
        eg.groupType,
        eg.profilePicture,
        COALESCE(
            (SELECT SUM(e.amount) FROM Expense e
             WHERE e.expenseGroup = eg AND e.payer.userId = ?1), 0
        )
        - COALESCE(
            (SELECT SUM(ep.contribution) FROM ExpenseParticipation ep
             WHERE ep.expense.expenseGroup = eg
               AND ep.user.userId = ?1), 0)
    )
    FROM ExpenseGroup eg
    JOIN eg.participants gp
    WHERE gp.userId = ?1
    """)
    List<GroupSummaryResponseDTO> findAllGroupSummariesForUser(Long userId);


    public interface UserStandingProjection {
        Long getGroupMateId();
        BigDecimal getAmountOwedOrLentToUser();
    }

    @Query(value = """
    SELECT CASE WHEN e.PayerID = :userId THEN ep.UserID ELSE e.PayerID END AS groupMateId,
           SUM(CASE WHEN e.PayerID = :userId THEN -ep.Contribution ELSE ep.Contribution END) AS amountOwedOrLentToUser
    FROM Expenses e
    JOIN ExpenseParticipation ep ON ep.ExpenseID = e.ExpenseID
    WHERE e.GroupID = :groupId
      AND ( (e.PayerID = :userId AND ep.UserID <> :userId)
         OR (e.PayerID <> :userId AND ep.UserID = :userId) )
    GROUP BY groupMateId
    """, nativeQuery = true)
    List<UserStandingProjection> findUserStandingInGroup(long groupId, Long userId);
}
