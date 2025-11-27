package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.model.User;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UserService {
    Optional<User> getUserByEmail(String email);
    Optional<User> getUserById(int id);
    User createUser(User user);
    User updateUser(User user);
    void deleteUser(int id);
    List<User> getAllUsers();
    Map<String, Object> getUserConnections(int userId);
    public boolean checkUserNameExists(String username);
    public boolean checkEmailExists(String email);
}
