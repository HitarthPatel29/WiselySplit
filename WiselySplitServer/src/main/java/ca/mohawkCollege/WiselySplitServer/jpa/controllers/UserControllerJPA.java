package ca.mohawkCollege.wiselySplitServer.jpa.controllers;

import ca.mohawkCollege.wiselySplitServer.jpa.dtos.UserDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.services.UserService;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import ca.mohawkCollege.wiselySplitServer.services.user.ImageUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jpa/users")
public class UserControllerJPA {

    @Autowired
    private UserService userService;
    @Autowired
    private ImageUploadService imageUploadService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createUser(
            @RequestParam("name") String name,
            @RequestParam("userName") String userName,
            @RequestParam("email") String email,
            @RequestParam(value = "phoneNum", required = false) Integer phoneNum,
            @RequestParam("password") String password,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
        try {
            // Build User object
            User user = new User();
            user.setName(name);
            user.setUserName(userName);
            user.setEmail(email);
            user.setPhoneNum(phoneNum);
            user.setPassword(password);

            // Upload if picture is provided
            if (profilePicture != null && !profilePicture.isEmpty()) {
                String url = imageUploadService.uploadProfilePicture(profilePicture);
                user.setProfilePicture(url);
            }

            // Save with default avatar if no picture
            UserDTO created = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
        catch (Exception e) {
            e.printStackTrace(); // log actual exception
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Get User by ID
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable int id) {
        UserDTO userDTO = userService.getUserById(id);
        return ResponseEntity.ok(userDTO);
    }

    // Get User by Email
    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        UserDTO userDTO = userService.getUserByEmail(email);
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/{id}/check-username")
    public ResponseEntity<?> checkUsername(@PathVariable int id, @RequestParam("username") String userName) {
        UserDTO existing = userService.getUserById(id);
        // Username uniqueness (excluding current user)
        if (!existing.getUserName().equalsIgnoreCase(userName) && userService.checkUserNameExists(userName)) {
            return ResponseEntity.ok(Map.of("available", false));
        }
        else{
            return ResponseEntity.ok(Map.of("available", true));
        }
    }

    @GetMapping("/{id}/check-email")
    public ResponseEntity<?> checkEmail(@PathVariable int id, @RequestParam("email") String email) {
        UserDTO existing = userService.getUserById(id);

        // Email uniqueness (excluding current user)
        if (!existing.getEmail().equalsIgnoreCase(email) && userService.checkEmailExists(email)) {
            return ResponseEntity.ok(Map.of("available", false));
        }
        else{
            return ResponseEntity.ok(Map.of("available", true));
        }
    }

    // Public endpoints for signup validation (no userId required)
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsernamePublic(@RequestParam("username") String userName) {
        return ResponseEntity.ok(Map.of("available", !userService.checkUserNameExists(userName)));
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailPublic(@RequestParam("email") String email) {
        return ResponseEntity.ok(Map.of("available", !userService.checkEmailExists(email)));
    }

    // Update User
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> updateUser(
            @PathVariable int id,
            @RequestParam("name") String name,
            @RequestParam("userName") String userName,
            @RequestParam("email") String email,
            @RequestParam("phoneNum") Long phoneNum,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
        try {
            // Generate new User DTO from updated fields
            UserDTO userDTO = new UserDTO();
            userDTO.setUserId(id);
            userDTO.setName(name);
            userDTO.setUserName(userName);
            userDTO.setEmail(email);
            //userDTO.setPhoneNum(phoneNum);

            // Handle profile picture
            if (profilePicture != null && !profilePicture.isEmpty()) {
                String url = imageUploadService.uploadProfilePicture(profilePicture);
                userDTO.setProfilePicture(url);
            }

            UserDTO updatedUserDTO = userService.updateUser(userDTO);
            return ResponseEntity.ok(updatedUserDTO);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // Delete User
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable int id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build(); // 204
    }

    // Get All Users
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}/connections")
    public ResponseEntity<?> getConnections(@PathVariable int userId) {
        try {
            return ResponseEntity.ok(userService.getUserConnections(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
