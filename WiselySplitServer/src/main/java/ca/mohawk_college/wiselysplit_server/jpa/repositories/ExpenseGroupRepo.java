package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseGroupRepo extends JpaRepository<ExpenseGroup, Long> {

    @Query("""
            SELECT CASE WHEN COUNT(g) > 0 THEN true ELSE false END
            FROM ExpenseGroup g JOIN g.participants p
            WHERE g.groupId = ?1 AND p.userId = ?2
            """)
    boolean existsByGroupIdAndParticipantUserId(Long groupId, Long userId);
}
