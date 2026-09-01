package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteStatus;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Invite;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InviteRepo extends JpaRepository<Invite, Long> {

    @Query("""
        SELECT i from Invite i
        JOIN FETCH i.sender
        JOIN FETCH i.receiver
        WHERE i.receiver is not null
            AND i.status = ?1
            AND (i.sender = ?2 or i.receiver = ?2)
    """)
    List<Invite> findAcceptedUserInvitesInvolving(InviteStatus status, User user);

    boolean existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(User sender, String email, Long groupId);

    @Modifying
    @Query("update Invite i set i.status = ?1 where i.inviteId = ?2")
    void updateStatusByInviteIdIs(InviteStatus status, Long inviteId);

    @Modifying
    @Query("""
        UPDATE Invite i
        SET i.status = InviteStatus.EXPIRED
        WHERE i.status = InviteStatus.PENDING
          AND i.expiresAt < CURRENT_TIMESTAMP
        """)
    void updateStatusForExpiredInvites();

    @Query("""
            SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END
            FROM Invite i
            WHERE i.inviteId = ?1
              AND (i.sender.userId = ?2 OR i.receiver.userId = ?2)
            """)
    boolean existsReadableByUser(Long inviteId, Long userId);

    boolean existsByInviteIdAndReceiver_UserId(Long inviteId, Long userId);
}
