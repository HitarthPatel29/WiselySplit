package ca.mohawkCollege.wiselySplitServer.jpa.repositories;

import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Integer> {

    Optional<User> findByEmail (String email);
    Optional<User> findByUserName (String userName);
    int countByRole(String role);
    int countAlL();

    @Query("UPDATE User u SET u.stripeAccountId = ?2 WHERE u.userID = ?1")
    int updateStripeAccountId(int userId, String stripeAccountId);
    Optional<String> getStripeAccountId(int userId);


}
