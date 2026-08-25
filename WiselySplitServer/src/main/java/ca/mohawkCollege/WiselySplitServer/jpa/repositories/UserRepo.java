package ca.mohawkCollege.wiselySplitServer.jpa.repositories;

import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByEmail (String email);
    Optional<User> findByUserName (String userName);
    int countByRole(String role);

    @Modifying
    @Query("UPDATE User u SET u.stripeAccountId = ?2 WHERE u.userId = ?1")
    void updateStripeAccountId(Long userId, String stripeAccountId);

    @EntityGraph(attributePaths = {"groups", "groups.participants"})
    @Query("SELECT u FROM User u WHERE u.userId = :userId")
    Optional<User> findByIdWithGroupsAndParticipants(Long userId);

}
