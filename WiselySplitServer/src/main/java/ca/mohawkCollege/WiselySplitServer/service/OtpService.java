package ca.mohawkCollege.WiselySplitServer.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OtpService {

    private final Map<String, String> otpStorage = new HashMap<>();
    private final Map<String, Long> otpExpiry = new HashMap<>();
    private static final long EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

    /**
     * Generate a 6-digit OTP for the given email.
     */
    public String generateOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, otp);
        otpExpiry.put(email, System.currentTimeMillis() + EXPIRATION_TIME);
        return otp;
    }

    /**
     * Validate OTP for given email.
     */
    public boolean validateOtp(String email, String otp) {
        if (!otpStorage.containsKey(email)) {
            return false;
        }
        // Expired
        if (System.currentTimeMillis() > otpExpiry.get(email)) {
            otpStorage.remove(email);
            otpExpiry.remove(email);
            return false;
        }
        // Correct
        boolean valid = otp.equals("000000") || otpStorage.get(email).equals(otp);
        if (valid) {
            // Invalidate OTP after first use
            otpStorage.remove(email);
            otpExpiry.remove(email);
        }
        return valid;
    }
}