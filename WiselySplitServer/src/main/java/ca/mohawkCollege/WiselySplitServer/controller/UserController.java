package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.model.User;
import ca.mohawkCollege.WiselySplitServer.service.ImageUploadService;
import ca.mohawkCollege.WiselySplitServer.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final ImageUploadService imageUploadService;

    @Autowired
    public UserController(UserService userService, ImageUploadService imageUploadService) {
        this.userService = userService;
        this.imageUploadService = imageUploadService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createUser(
            @RequestParam("name") String name,
            @RequestParam("userName") String userName,
            @RequestParam("email") String email,
            @RequestParam("phoneNum") Long phoneNum,
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
            User created = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
        catch (Exception e) {
            e.printStackTrace(); // log actual exception
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }

//        catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
//        }
    }


    // Get User by ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable int id) {
        User user = userService.getUserById(id).get();
        return ResponseEntity.ok(user);
    }

    // Get User by Email
    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        User user = userService.getUserByEmail(email).get();
        return ResponseEntity.ok(user);
    }

    // Update User
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> updateUser(
            @PathVariable int id,
            @RequestParam("name") String name,
            @RequestParam("userName") String userName,
            @RequestParam("email") String email,
            @RequestParam("phoneNum") Long phoneNum,
            @RequestParam("password") String password,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
        try {
            // Fetch existing user
            User existing = userService.getUserById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Update fields
            existing.setName(name);
            existing.setUserName(userName);
            existing.setEmail(email);
            existing.setPhoneNum(phoneNum);
            existing.setPassword(password);

            // Handle profile picture
            if (profilePicture != null && !profilePicture.isEmpty()) {
                String url = imageUploadService.uploadProfilePicture(profilePicture);
                existing.setProfilePicture(url);
            }

            User updated = userService.updateUser(existing);
            return ResponseEntity.ok(updated);

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
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}