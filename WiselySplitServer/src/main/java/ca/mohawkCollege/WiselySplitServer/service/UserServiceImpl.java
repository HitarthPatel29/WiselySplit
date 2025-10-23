package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.Security.PasswordUtil;
import ca.mohawkCollege.WiselySplitServer.Security.ValidationUtil;
import ca.mohawkCollege.WiselySplitServer.dao.InviteDAO;
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
    private static final String DEFAULT_AVATAR_URL = "https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp";

    @Autowired
    private InviteDAO inviteDAO;


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
        if (user.getProfilePicture() == null || user.getProfilePicture().isEmpty()) {
            user.setProfilePicture(DEFAULT_AVATAR_URL);
        }

        if (!ValidationUtil.isValidEmail(user.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (!ValidationUtil.isStrongPassword(user.getPassword())) {
            throw new IllegalArgumentException("Weak password");
        }
        if (userDAO.findByEmail(user.getEmail()).isPresent()) {
            throw new DuplicateUserException("This Email is already attached with an Existing Account");
        }
        if (userDAO.findByUsername(user.getUserName()).isPresent()) {
            throw new DuplicateUserException("Username Not Available, Choose a Unique UserName");
        }

        try {
            user.setPassword(PasswordUtil.hashPassword(user.getPassword()));
            userDAO.save(user);
            inviteDAO.linkInvitesToUser(user.getEmail(), user.getUserId());
            return user;
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }
    }
    @Override
    public User updateUser(User user) {
        userDAO.findById(user.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User with ID " + user.getUserId() + " not found"));

        // Same validations
        if (!ValidationUtil.isValidEmail(user.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (!ValidationUtil.isStrongPassword(user.getPassword())) {
            throw new IllegalArgumentException("Weak password");
        }

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