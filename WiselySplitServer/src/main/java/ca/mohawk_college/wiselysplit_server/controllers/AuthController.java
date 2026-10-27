package ca.mohawk_college.wiselysplit_server.controllers;

import ca.mohawk_college.wiselysplit_server.configs.SecurityConfig;
import ca.mohawk_college.wiselysplit_server.exceptions.InvalidRefreshTokenException;
import ca.mohawk_college.wiselysplit_server.services.RefreshTokenService;
import ca.mohawk_college.wiselysplit_server.utilities.auth.RefreshCookieUtil;
import ca.mohawk_college.wiselysplit_server.utilities.auth.JwtUtil;
import ca.mohawk_college.wiselysplit_server.utilities.auth.PasswordUtil;
import ca.mohawk_college.wiselysplit_server.daos.UserDAO;
import ca.mohawk_college.wiselysplit_server.models.Role;
import ca.mohawk_college.wiselysplit_server.models.User;
import ca.mohawk_college.wiselysplit_server.models.dtos.AdminUserView;
import ca.mohawk_college.wiselysplit_server.services.EmailServiceMailTrapAPI;
import ca.mohawk_college.wiselysplit_server.services.OtpService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.LinkedHashMap;
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
    private final RefreshTokenService refreshTokenService;
    private final RefreshCookieUtil refreshCookieUtil;

    @Value("${google.client.id}")
    private String googleClientId;

    public AuthController(AuthenticationManager authManager, JwtUtil jwtUtil, UserDAO userDAO,
                          EmailServiceMailTrapAPI emailServiceMailTrapAPI, OtpService otpService,
                          RefreshTokenService refreshTokenService, RefreshCookieUtil refreshCookieUtil) {
        this.authManager = authManager;
        this.jwtUtil = jwtUtil;
        this.userDAO = userDAO;
        this.emailServiceMailTrapAPI = emailServiceMailTrapAPI;
        this.otpService = otpService;
        this.refreshTokenService = refreshTokenService;
        this.refreshCookieUtil = refreshCookieUtil;
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
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String email = asString(body.get("email"));
        String otp = asString(body.get("otp"));
        boolean remember = asBoolean(body.get("remember"));

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }

        Optional<User> userOpt = userDAO.findByEmail(email);
        // Only ADMIN / TEST_PROFILE may use the "000000" master OTP.
        boolean allowMaster = userOpt.map(u -> Role.allowsMasterOtp(u.getRole())).orElse(false);

        if (otpService.validateOtp(email, otp, allowMaster)) {
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }
            return issueSession(userOpt.get(), remember, request, Map.of());
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired OTP"));
        }
    }

    /**
     * Exchanges the HttpOnly refresh cookie for a new access token and rotates the cookie.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        if (!isAllowedOrigin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Origin not allowed"));
        }
        try {
            RefreshTokenService.RotationResult result =
                    refreshTokenService.rotate(refreshCookieUtil.read(request), request);
            return tokenResponse(result.user(), result.refreshToken(), Map.of());
        } catch (InvalidRefreshTokenException e) {
            if (!e.isSessionEnded()) {
                // Lost a rotation race; clearing the cookie here would wipe the winner's new token.
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Session refresh already in progress, retry"));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, refreshCookieUtil.clear().toString())
                    .body(Map.of("error", "Session expired, please log in again"));
        }
    }

    /**
     * Ends the current session: revokes its refresh-token family and clears the cookie.
     * Public because the access token may already be expired.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        if (!isAllowedOrigin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Origin not allowed"));
        }
        refreshTokenService.revokeByRawToken(refreshCookieUtil.read(request));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookieUtil.clear().toString())
                .body(Map.of("message", "Logged out"));
    }

    /** Revokes every session of the authenticated caller (all devices). */
    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(Authentication auth) {
        Optional<User> userOpt = userDAO.findByEmail(auth.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }
        refreshTokenService.revokeAllForUser(userOpt.get().getUserId());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookieUtil.clear().toString())
                .body(Map.of("message", "Logged out of all devices"));
    }

    /**
     * Returns the authenticated caller's own profile + role.
     * Used by the frontend to guard /admin routes and toggle admin UI.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        Optional<User> userOpt = userDAO.findByEmail(auth.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(AdminUserView.from(userOpt.get()));
    }

    /**
     * Google Sign-In endpoint
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String idTokenString = asString(body.get("token"));
            boolean remember = asBoolean(body.get("remember"));
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
            String picture = (String) payload.get("picture");
            String googleSubjectID = payload.getSubject();


            // Look up user via UserDAO
            Optional<User> existingUser = userDAO.findByEmail(email);

            User user = existingUser.orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName(name);
                newUser.setUserName(email.split("@")[0]);
                String generatedPassword = ((String) payload.get("given_name")).toLowerCase() + googleSubjectID.substring(0, 4);    //(John + 109873... -> john1098)
                newUser.setPassword(PasswordUtil.hashPassword(generatedPassword));      // dummy, never used
                newUser.setProfilePicture(picture);
                newUser.setUserId(userDAO.save(newUser));   // creates User and sets UserID
                return newUser;
            });

            return issueSession(user, remember, request, Map.of(
                    "email", user.getEmail(),
                    "name", user.getName()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error","Google login failed: " + e.getMessage()));
        }
    }

    // -------------------------------------------------------------- helpers

    /** Starts a new login session: access token in the body, refresh token in an HttpOnly cookie. */
    private ResponseEntity<?> issueSession(User user, boolean remember, HttpServletRequest request,
                                           Map<String, Object> extra) {
        RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issue(user, remember, request);
        return tokenResponse(user, refreshToken, extra);
    }

    private ResponseEntity<?> tokenResponse(User user, RefreshTokenService.IssuedRefreshToken refreshToken,
                                            Map<String, Object> extra) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("token", jwtUtil.generateToken(user.getUserId(), user.getEmail()));
        body.put("tokenType", "Bearer");
        body.put("expiresInMs", jwtUtil.getExpirationMs());
        body.putAll(extra);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookieUtil.build(refreshToken).toString())
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    /**
     * CSRF defence for the cookie-authenticated endpoints. Browsers always send Origin on
     * cross-origin POSTs, so a missing header can only come from a non-browser client.
     */
    private static boolean isAllowedOrigin(HttpServletRequest request) {
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        return origin == null || SecurityConfig.ALLOWED_ORIGINS.contains(origin);
    }

    private static String asString(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static boolean asBoolean(Object o) {
        if (o instanceof Boolean b) return b;
        return o != null && Boolean.parseBoolean(String.valueOf(o));
    }
}