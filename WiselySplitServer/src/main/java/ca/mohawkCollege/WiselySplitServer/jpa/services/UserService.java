package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.daos.InviteDAO;
import ca.mohawkCollege.wiselySplitServer.exceptions.DuplicateUserException;
import ca.mohawkCollege.wiselySplitServer.exceptions.UserNotFoundException;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.*;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.UserRepo;
import ca.mohawkCollege.wiselySplitServer.utilities.auth.PasswordUtil;
import ca.mohawkCollege.wiselySplitServer.utilities.auth.ValidationUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepo userRepo;
    @Autowired
    private InviteDAO inviteDAO;
    @Value("${cloudinary.default_photo_link}")
    private String DEFAULT_AVATAR_URL;
    @Autowired
    private InviteServiceJpa inviteService;
    public UserResponseDTO getUserByEmail(String email){
        User userByEmail = userRepo.findByEmail(email).orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
        return userToUserResponseDTO(userByEmail);
    }
    public UserResponseDTO getUserById(Long id){
        User userById = userRepo.findById(id).orElseThrow(() -> new UserNotFoundException("User with ID: "+id+" not found!" ));
        return userToUserResponseDTO(userById);
    }
    public UserResponseDTO createUser(User user){
        if (user.getProfilePicture() == null || user.getProfilePicture().isEmpty())
            user.setProfilePicture(DEFAULT_AVATAR_URL);

        if (!ValidationUtil.isValidEmail(user.getEmail())) throw new IllegalArgumentException("Invalid email format");

        if (!ValidationUtil.isStrongPassword(user.getPassword())) throw new IllegalArgumentException("Weak password");

        if (checkEmailExists(user.getEmail())) throw new DuplicateUserException("This Email is already attached with an Existing Account");

        if (checkUserNameExists(user.getUserName())) throw new DuplicateUserException("Username Not Available, Choose a Unique UserName");

        try {
            user.setPassword(PasswordUtil.hashPassword(user.getPassword()));
            User savedUser = userRepo.save(user);
            inviteDAO.linkInvitesToUser(user.getEmail(), Math.toIntExact(savedUser.getUserId())); //sets UserID for all external Email Invites
            return userToUserResponseDTO(savedUser);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }
    }

    /**
     * gets the UserUpdateRequestDTO, Updates the User and returns the DTO of updatedUser
     * @param userUpdateRequestDTO
     * @return updatedDTO
     */
    @Transactional
    public UserResponseDTO updateUser(UserUpdateRequestDTO userUpdateRequestDTO){
        User exsistingUser = userRepo.findById(userUpdateRequestDTO.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User with ID " + userUpdateRequestDTO.getUserId() + " not found"));

        // Email validation
        if (!ValidationUtil.isValidEmail(userUpdateRequestDTO.getEmail()))  throw new IllegalArgumentException("Invalid email format");

        // Duplicate User Validations
        // checks if it is not updated, if Updated check in DB, if not
        if (!exsistingUser.getEmail().equals(userUpdateRequestDTO.getEmail()) && checkEmailExists(userUpdateRequestDTO.getEmail()))
            throw new DuplicateUserException("This Email is already attached with an Existing Account");
        if (!exsistingUser.getUserName().equals(userUpdateRequestDTO.getUserName()) && checkUserNameExists(userUpdateRequestDTO.getUserName()))
            throw new DuplicateUserException("Username Not Available, Choose a Unique UserName");

        exsistingUser.setName(userUpdateRequestDTO.getName());
        exsistingUser.setUserName(userUpdateRequestDTO.getUserName());
        exsistingUser.setEmail(userUpdateRequestDTO.getEmail());
        exsistingUser.setPhoneNum(userUpdateRequestDTO.getPhoneNum());

        //if not URL -> set the Default URL
        String profilePictureURL = null == userUpdateRequestDTO.getProfilePicture() ? DEFAULT_AVATAR_URL : userUpdateRequestDTO.getProfilePicture();
        exsistingUser.setProfilePicture(profilePictureURL);

        try {
            User updatedUser = userRepo.save(exsistingUser);
            return userToUserResponseDTO(updatedUser);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }
    }
    public void deleteUser(Long id){
        userRepo.deleteById(id);
    }
    public List<UserResponseDTO> getAllUsers(){
         List<User> userList = userRepo.findAll();
         List<UserResponseDTO> UserResponseDTOList = userList.stream().map(this::userToUserResponseDTO).toList();
         return UserResponseDTOList;
    }

    public record ConnectionListDTO(List<UserResponseForListDTO> friends, List<GroupResponseForListDTO> groups){}
    @Transactional()
    public ConnectionListDTO getUserConnections(Long userId){
        User user = userRepo.findByIdWithGroupsAndParticipants(userId)
                .orElseThrow(()-> new UserNotFoundException("User with id: " + userId + " not found"));

        List<GroupResponseForListDTO> groupsOfUser = user.getGroups().stream()
                .map(group -> new GroupResponseForListDTO(
                        group.getGroupId(),
                        group.getGroupName(),
                        group.getGroupType(),
                        group.getProfilePicture(),
                        group.getParticipants().stream()
                                .map(p -> new UserResponseForListDTO(
                                        p.getUserId(), p.getName(), p.getUserName(), p.getProfilePicture()
                                )).toList()
                        )
                ).toList();

        List<UserResponseForListDTO> friendsOfUser = inviteService.getFriendsOfUser(user);

        return new ConnectionListDTO(friendsOfUser, groupsOfUser);
    }

    public boolean checkUserNameExists(String username) { return userRepo.findByUserName(username).isPresent(); }

    public boolean checkEmailExists(String email){ return userRepo.findByEmail(email).isPresent(); }

    /**
     * This is a helper method that converts User to UserResponseDTO
     * @param user
     * @return new UserResponseDTO
     */
    public UserResponseDTO userToUserResponseDTO(User user) {
        return new UserResponseDTO(
                user.getUserId(),
                user.getName(),
                user.getUserName(),
                user.getEmail(),
                user.getPhoneNum(),
                user.getProfilePicture(),
                user.getStripeAccountId()
        );
    }

}