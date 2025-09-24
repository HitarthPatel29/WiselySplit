package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.Security.PasswordUtil;
import ca.mohawkCollege.WiselySplitServer.model.User;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.exceptions.UserNotFoundException;
import ca.mohawkCollege.WiselySplitServer.exceptions.DuplicateUserException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;



@Service
public class UserServiceImpl implements UserService {

    private final UserDAO userDAO;

    @Autowired
    public UserServiceImpl(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    @Override
    public Optional<User> getUserByEmail(String email) {
        return userDAO.findByEmail(email)
                .map(Optional::of)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
    }

    @Override
    public Optional<User> getUserById(int id) {
        return userDAO.findById(id)
                .map(Optional::of)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + id + " not found"));
    }

    @Override
    public User createUser(User user) {
        try {
            user.setPassword(PasswordUtil.hashPassword(user.getPassword()));
            userDAO.save(user);
            return user;
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }
    }

    @Override
    public User updateUser(User user) {
        // check if user exists before updating
        userDAO.findById(user.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User with ID " + user.getUserId() + " not found"));

        try {
            user.setPassword(PasswordUtil.hashPassword(user.getPassword()));
            userDAO.update(user);
            return user;
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }
    }

    @Override
    public void deleteUser(int id) {
        // check if user exists before deleting
        userDAO.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + id + " not found"));

        userDAO.delete(id);
    }

    @Override
    public List<User> getAllUsers() {
        return userDAO.findAll();
    }
}