package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.daos.InviteDAO;
import ca.mohawkCollege.wiselySplitServer.exceptions.DuplicateUserException;
import ca.mohawkCollege.wiselySplitServer.exceptions.UserNotFoundException;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.UserDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.UserRepo;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import ca.mohawkCollege.wiselySplitServer.utilities.auth.*;

import java.util.List;
import java.util.Map;

@Service
public class UserService {
    @Autowired
    private UserRepo userRepo;
    @Autowired
    private InviteDAO inviteDAO;
    @Value("${cloudinary.default_photo_link}")
    private String DEFAULT_AVATAR_URL;

    public UserDTO getUserByEmail(String email){
        User userByEmail = userRepo.findByEmail(email).orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
        return userToUserDTO(userByEmail);
    }
    public UserDTO getUserById(int id){
        User userById = userRepo.findById(id).orElseThrow(() -> new UserNotFoundException("User with ID: "+id+" not found!" ));
        return userToUserDTO(userById);
    }
    public UserDTO createUser(User user){
        if (user.getProfilePicture() == null || user.getProfilePicture().isEmpty())
            user.setProfilePicture(DEFAULT_AVATAR_URL);

        if (!ValidationUtil.isValidEmail(user.getEmail())) throw new IllegalArgumentException("Invalid email format");

        if (!ValidationUtil.isStrongPassword(user.getPassword())) throw new IllegalArgumentException("Weak password");

        if (checkEmailExists(user.getEmail())) throw new DuplicateUserException("This Email is already attached with an Existing Account");

        if (checkUserNameExists(user.getUserName())) throw new DuplicateUserException("Username Not Available, Choose a Unique UserName");

        try {
            user.setPassword(PasswordUtil.hashPassword(user.getPassword()));
            User savedUser = userRepo.save(user);
            inviteDAO.linkInvitesToUser(user.getEmail(), savedUser.getUserId()); //sets UserID for all external Email Invites
            return userToUserDTO(savedUser);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }
    }

    /**
     * gets the UserDTO, Updates the User and returns the DTO of updatedUser
     * @param userDTO
     * @return updatedDTO
     */
    @Transactional
    public UserDTO updateUser(UserDTO userDTO){
        User userToUpdate = userRepo.findById(userDTO.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User with ID " + userDTO.getUserId() + " not found"));

        // Email validation
        if (!ValidationUtil.isValidEmail(userDTO.getEmail()))  throw new IllegalArgumentException("Invalid email format");

        // Duplicate User Validations
        if (checkEmailExists(userDTO.getEmail())) throw new DuplicateUserException("This Email is already attached with an Existing Account");
        if (checkUserNameExists(userDTO.getUserName())) throw new DuplicateUserException("Username Not Available, Choose a Unique UserName");

        userToUpdate.setName(userDTO.getName());
        userToUpdate.setUserName(userDTO.getUserName());
        userToUpdate.setEmail(userDTO.getEmail());
        userToUpdate.setPhoneNum(userDTO.getPhoneNum());

        //if not URL -> set the Default URL
        String profilePictureURL = null != userDTO.getProfilePicture() ? DEFAULT_AVATAR_URL : userDTO.getProfilePicture();
        userToUpdate.setProfilePicture(profilePictureURL);

        try {
            User updatedUser = userRepo.save(userToUpdate);
            return userToUserDTO(updatedUser);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }
    }
    public void deleteUser(int id){
        userRepo.deleteById(id);
    }
    public List<UserDTO> getAllUsers(){
         List<User> userList = userRepo.findAll();
         List<UserDTO> userDTOList = userList.stream().map(this::userToUserDTO).toList();
         return userDTOList;
    }

    public Map<String, Object> getUserConnections(int userId){
        return null;
    }

    public boolean checkUserNameExists(String username){
        return userRepo.findByUserName(username).isPresent();
    }
    public boolean checkEmailExists(String email){
        return userRepo.findByEmail(email).isPresent();
    }

    /**
     * This is a helper method that converts User to UserDTO
     * @param user
     * @return new userDTO
     */
    public UserDTO userToUserDTO(User user) {
        return new UserDTO(
                user.getUserId(),
                user.getName(),
                user.getUserName(),
                user.getEmail(),
                user.getPhoneNum(),
                user.getProfilePicture()
        );
    }

}