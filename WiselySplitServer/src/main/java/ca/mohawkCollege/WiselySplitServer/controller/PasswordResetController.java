package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.Security.JwtUtil;
import ca.mohawkCollege.WiselySplitServer.model.User;
import ca.mohawkCollege.WiselySplitServer.service.PasswordResetService;
import ca.mohawkCollege.WiselySplitServer.service.UserServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth/reset")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;
    private final UserServiceImpl userService;
    private final JwtUtil jwtUtil;

    public PasswordResetController(PasswordResetService resetService, UserServiceImpl userService, JwtUtil jwtUtil) {
        this.passwordResetService = resetService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    /** Step 1: Request reset (send OTP) */
    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestReset(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        boolean ok = passwordResetService.createPasswordResetToken(email);

        Map<String, String> response = new HashMap<>();
        if (ok) {
            response.put("status", "success");
            response.put("message", "OTP sent to " + email);
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "error");
            response.put("message", "Email not found");
            return ResponseEntity.badRequest().body(response);
        }
    }

    /** Step 2: Verify OTP */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        Map<String, String> response = new HashMap<>();
        if (passwordResetService.verifyOtp(email, otp)) {
            Optional<User> user = userService.getUserByEmail(email);
            String resetToken = jwtUtil.generateResetToken(user.get().getUserId());

            response.put("status", "success");
            response.put("resetToken", resetToken);
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "error");
            response.put("message", "Invalid or expired OTP");
            return ResponseEntity.badRequest().body(response);
        }
    }

    /** Step 3: Confirm reset (update password) */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> confirmReset(@RequestBody Map<String, String> body) {
        String resetToken = body.get("resetToken");
        String newPassword = body.get("newPassword");

        int userId = jwtUtil.validateResetToken(resetToken);
        boolean ok = passwordResetService.resetPassword(userId, newPassword);

        Map<String, String> response = new HashMap<>();
        if (ok) {
            response.put("status", "success");
            response.put("message", "Password updated successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "error");
            response.put("message", "Password reset failed");
            return ResponseEntity.badRequest().body(response);
        }
    }
}