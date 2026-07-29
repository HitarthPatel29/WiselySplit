package ca.mohawkCollege.wiselySplitServer.jpa.repositories;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteStatus;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Invite;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
