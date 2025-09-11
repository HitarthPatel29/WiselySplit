package ca.mohawkCollege.WiselySplitServer.repository;

import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {

}
