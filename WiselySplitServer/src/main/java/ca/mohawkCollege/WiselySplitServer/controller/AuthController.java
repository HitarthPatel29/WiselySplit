package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.Security.JwtUtil;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.model.User;
import ca.mohawkCollege.WiselySplitServer.service.EmailServiceMailTrapAPI;
import ca.mohawkCollege.WiselySplitServer.service.OtpService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserDAO userDAO;
    private final EmailServiceMailTrapAPI emailServiceMailTrapAPI;
    private final OtpService otpService;

    @Value("${google.client.id}")
    private String googleClientId;

    public AuthController(AuthenticationManager authManager, JwtUtil jwtUtil, UserDAO userDAO, EmailServiceMailTrapAPI emailServiceMailTrapAPI, OtpService otpService) {
        this.authManager = authManager;
        this.jwtUtil = jwtUtil;
        this.userDAO = userDAO;
        this.emailServiceMailTrapAPI = emailServiceMailTrapAPI;
        this.otpService = otpService;
    }

    /**
     * Step 1: Validate email+password, send OTP (no JWT yet)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email and password are required"));
        }

        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
            UserDetails principal = (UserDetails) auth.getPrincipal();

            // Generate OTP
            String otp = otpService.generateOtp(email);
            emailServiceMailTrapAPI.sendEmail(email, "Your Login OTP", "Your OTP is: " + otp);

            return ResponseEntity.ok(Map.of(
                    "message", "OTP sent to your email. Please verify."
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }
    }

    /**
     * Step 2: Verify OTP, then issue JWT
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }

        if (otpService.validateOtp(email, otp)) {
            Optional<User> userOpt = userDAO.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();

            String jwt = jwtUtil.generateToken(user.getUserId(), user.getEmail());
            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "tokenType", "Bearer",
                    "expiresInMs", 3600000
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired OTP"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message","Logged out (discard token on client)"));
    }

    /**
     * Google Sign-In endpoint
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        try {
            String idTokenString = body.get("token");
            if (idTokenString == null) {
                return ResponseEntity.badRequest().body(Map.of("error","Missing Google ID token"));
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory()
            ).setAudience(Collections.singletonList(googleClientId)).build();

            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error","Invalid Google ID token"));
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // Look up user via UserDAO
            Optional<User> existingUser = userDAO.findByEmail(email);

            User user = existingUser.orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName(name);
                newUser.setPassword("GOOGLE_USER"); // dummy, never used
                userDAO.save(newUser);
                return newUser;
            });

            // Issue JWT
            String jwt = jwtUtil.generateToken(user.getUserId(), user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "tokenType", "Bearer",
                    "expiresInMs", 3600000,
                    "email", user.getEmail(),
                    "name", user.getName()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error","Google login failed: " + e.getMessage()));
        }
    }
}