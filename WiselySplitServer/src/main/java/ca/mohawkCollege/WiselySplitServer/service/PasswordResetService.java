package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.Security.ValidationUtil;
import ca.mohawkCollege.WiselySplitServer.dao.PasswordResetTokenDAO;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.model.PasswordResetToken;
import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class PasswordResetService {

    private final UserDAO userDAO;
    private final PasswordResetTokenDAO tokenDAO;
    private final EmailServiceMailTrapAPI emailServiceMailTrapAPI; // you already have/will need this
    private final BCryptPasswordEncoder passwordEncoder;

    public PasswordResetService(UserDAO userDAO, PasswordResetTokenDAO tokenDAO, EmailServiceMailTrapAPI emailServiceMailTrapAPI) {
        this.userDAO = userDAO;
        this.tokenDAO = tokenDAO;
        this.emailServiceMailTrapAPI = emailServiceMailTrapAPI;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /** Step 1: Generate OTP and email it */
    public boolean createPasswordResetToken(String email) {
        Optional<User> userOpt = userDAO.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Hash OTP
        String otpHash = passwordEncoder.encode(otp);

        // Save to DB
        PasswordResetToken token = new PasswordResetToken();
        token.setUserId(user.getUserId());
        token.setOtpHash(otpHash);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        token.setAttempts(0);
        tokenDAO.save(token);

        // Send email
        String subject = "WiselySplit – Password Reset OTP";
        String body = "Your OTP is: " + otp + "\nThis code will expire in 10 minutes.";
        emailServiceMailTrapAPI.sendEmail(user.getEmail(), subject, body);

        return true;
    }

    /** Step 2: Verify OTP */
    public boolean verifyOtp(String email, String otp) {
        Optional<User> userOpt = userDAO.findByEmail(email);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();
        Optional<PasswordResetToken> tokenOpt = tokenDAO.findByUserId(user.getUserId());
        if (tokenOpt.isEmpty()) return false;

        PasswordResetToken token = tokenOpt.get();

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false; // expired
        }

        if (!passwordEncoder.matches(otp, token.getOtpHash())) {
            tokenDAO.incrementAttempts(token.getId());
            return false; // wrong OTP
        }

        return true; // success
    }

    public boolean resetPassword(int userID, String newPassword) {
        if (!ValidationUtil.isStrongPassword(newPassword)) {
            throw new IllegalArgumentException("Weak password – must include upper, lower, digit, special and be 8+ chars");
        }

        Optional<User> userOpt = userDAO.findById(userID);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();
        String hashedPassword = passwordEncoder.encode(newPassword);
        userDAO.updatePassword(user.getUserId(), hashedPassword);

        tokenDAO.findByUserId(user.getUserId()).ifPresent(t -> tokenDAO.markConsumed(t.getId()));

        return true;
    }
}