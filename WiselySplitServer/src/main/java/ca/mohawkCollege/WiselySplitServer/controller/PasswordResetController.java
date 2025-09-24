package ca.mohawkCollege.WiselySplitServer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/reset")
public class PasswordResetController {

    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestReset(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        // TODO: Send OTP/email
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Reset link/OTP sent to " + email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        // TODO: Verify OTP from DB/cache
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "OTP verified for " + email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> confirmReset(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String newPassword = body.get("newPassword");
        // TODO: Update password in DB
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Password updated successfully for " + email);
        return ResponseEntity.ok(response);
    }
}
