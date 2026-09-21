package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.FriendResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.FriendResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendsRepo extends JpaRepository<User, Long> {
    Optional<UserResponseForListDTO> findByUserId(Long userId);

    /**
     * Friends of the user, each with the running balance between the two of them.
     * <p>
     * Friendship is read from Invites (an accepted USER invite in either direction) rather than
     * inferred from the expense history, so a friend keeps showing up once the two are settled up,
     * and people who only share a group expense are not mistaken for friends.
     * <p>
     * The balance is a correlated subquery rather than a join + group by. It only sums the
     * participation rows that pair the user with that one friend, which is a stricter condition
     * than {@code isPersonal = false} (a personal expense has no participant other than its own
     * payer), and it ignores the other members' shares of a group expense. The zero-amount
     * "Fugazi" placeholder expense contributes 0, so it cannot skew the total either.
     * <p>
     * Sign convention matches {@code ExpenseResponseForListRowMapper}: positive means the friend
     * owes the user, negative means the user owes the friend.
     *
     * @param userId the user whose friends list is being built
     * @return one row per friend, with a zero balance when nothing is outstanding
     */
    @Query("""
            SELECT DISTINCT new ca.mohawk_college.wiselysplit_server.jpa.dtos.FriendResponseForListDTO(
                friend.userId,
                friend.name,
                friend.userName,
                friend.profilePicture,
                (
                    SELECT COALESCE(SUM(CASE WHEN e.payer.userId = :userId
                                             THEN p.contribution
                                             ELSE -p.contribution END), 0)
                    FROM ExpenseParticipation p
                        JOIN p.expense e
                    WHERE (e.payer.userId = :userId AND p.user.userId = friend.userId)
                       OR (e.payer.userId = friend.userId AND p.user.userId = :userId)
                )
            )
            FROM Invite i
                JOIN User friend
                    ON friend.userId = CASE WHEN i.sender.userId = :userId
                                            THEN i.receiver.userId
                                            ELSE i.sender.userId END
            WHERE i.status = InviteStatus.ACCEPTED
              AND i.type = InviteType.USER
              AND i.receiver IS NOT NULL
              AND (i.sender.userId = :userId OR i.receiver.userId = :userId)
            ORDER BY friend.name
            """)
    List<FriendResponseForListDTO> findFriendsWithBalances(Long userId);
}
