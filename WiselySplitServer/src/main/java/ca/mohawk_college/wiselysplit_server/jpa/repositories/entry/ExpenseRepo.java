package ca.mohawk_college.wiselysplit_server.jpa.repositories.entry;

import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepo extends JpaRepository<Expense, Long> {

    @Query("""
            select e from Expense e left join e.participants participants
            where (e.payer.userId = ?1 or participants.user.userId = ?1) and e.date between ?2 and ?3""")
    List<Expense> findAllByPayerOrParticipantAndDateRange(Long userId, LocalDate dateStart, LocalDate dateEnd);

    @Query("""
            SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
            FROM Expense e
            LEFT JOIN e.participants p
            LEFT JOIN e.expenseGroup g
            LEFT JOIN g.participants gp
            WHERE e.entryId = :expenseId
              AND (e.payer.userId = :userId
                   OR p.user.userId = :userId
                   OR gp.userId = :userId)
            """)
    boolean existsReadableByUser(Long expenseId, Long userId);

    @Query("""
            SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
            FROM Expense e
            LEFT JOIN e.participants p
            WHERE e.entryId = ?1
              AND (e.payer.userId = ?2 OR p.user.userId = ?2)
            """)
    boolean existsWritableByUser(Long expenseId, Long userId);
}
