package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.UserService;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.services.user.ImageUploadService;
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
            @RequestParam(value = "phoneNum", required = false) Long phoneNum,
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
            UserResponseDTO created = userService.createUser(user);
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
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        UserResponseDTO userResponseDTO = userService.getUserById(id);
        return ResponseEntity.ok(userResponseDTO);
    }

    // Get User by Email
    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponseDTO> getUserByEmail(@PathVariable String email) {
        UserResponseDTO userResponseDTO = userService.getUserByEmail(email);
        return ResponseEntity.ok(userResponseDTO);
    }

    @GetMapping("/{id}/check-username")
    public ResponseEntity<?> checkUsername(@PathVariable Long id, @RequestParam("username") String userName) {
        UserResponseDTO existing = userService.getUserById(id);
        // Username uniqueness (excluding current user)
        if (!existing.getUserName().equalsIgnoreCase(userName) && userService.checkUserNameExists(userName)) {
            return ResponseEntity.ok(Map.of("available", false));
        }
        else{
            return ResponseEntity.ok(Map.of("available", true));
        }
    }

    @GetMapping("/{id}/check-email")
    public ResponseEntity<?> checkEmail(@PathVariable Long id, @RequestParam("email") String email) {
        UserResponseDTO existing = userService.getUserById(id);

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
            @PathVariable long id,
            @RequestParam("name") String name,
            @RequestParam("userName") String userName,
            @RequestParam("email") String email,
            @RequestParam("phoneNum") Long phoneNum,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
        try {
            // Generate new User DTO from updated fields
            String url = (profilePicture != null && !profilePicture.isEmpty()) ? imageUploadService.uploadProfilePicture(profilePicture): null;

            UserUpdateRequestDTO userUpdateRequestDTO = new UserUpdateRequestDTO( id, name, userName, email, phoneNum, url );
            UserResponseDTO updatedUserResponseDTO = userService.updateUser(userUpdateRequestDTO);
            return ResponseEntity.ok(updatedUserResponseDTO);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // Delete User
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build(); // 204
    }

    // Get All Users
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> userResponseDTOs = userService.getAllUsers();
        return ResponseEntity.ok(userResponseDTOs);
    }

    @GetMapping("/{userId}/connections")
    public ResponseEntity<?> getConnections(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(userService.getUserConnections(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
