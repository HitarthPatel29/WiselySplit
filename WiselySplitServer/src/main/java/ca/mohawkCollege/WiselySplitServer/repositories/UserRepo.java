package ca.mohawkCollege.wiselySplitServer.repositories;

import ca.mohawkCollege.wiselySplitServer.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

@Component
public interface UserRepo extends JpaRepository<User, Integer> {
}
