package ca.mohawkCollege.wiselySplitServer.models;

/**
 * Single-role RBAC roles. Stored as the plain name (e.g. "ADMIN") in the
 * User.Role column; Spring Security authorities are derived as ROLE_&lt;name&gt;.
 */
public enum Role {
    ADMIN,
    TEST_PROFILE,
    USER;

    public static final String DEFAULT = USER.name();

    /** Returns true if the given raw value maps to a known role. */
    public static boolean isValid(String raw) {
        if (raw == null) return false;
        for (Role r : values()) {
            if (r.name().equals(raw)) return true;
        }
        return false;
    }

    /** Normalizes a possibly null/blank/lower-cased role to a valid stored value. */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) return DEFAULT;
        String upper = raw.trim().toUpperCase();
        return isValid(upper) ? upper : DEFAULT;
    }

    /** ADMIN and TEST_PROFILE may use the "000000" master OTP; USER may not. */
    public static boolean allowsMasterOtp(String raw) {
        String role = normalize(raw);
        return ADMIN.name().equals(role) || TEST_PROFILE.name().equals(role);
    }
}
