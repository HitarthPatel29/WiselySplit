package ca.mohawk_college.wiselysplit_server.services.user;

import ca.mohawk_college.wiselysplit_server.models.User;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UserService {
    Optional<User> getUserByEmail(String email);
    Optional<User> getUserById(long id);
    User createUser(User user);
    User updateUser(User user);
    void deleteUser(long id);
    List<User> getAllUsers();
    Map<String, Object> getUserConnections(long userId);
    public boolean checkUserNameExists(String username);
    public boolean checkEmailExists(String email);
}
