package ca.mohawkCollege.wiselySplitServer.models.dtos;

import ca.mohawkCollege.wiselySplitServer.models.Role;
import ca.mohawkCollege.wiselySplitServer.models.User;

/**
 * Sanitized view of a User for admin responses and the /api/auth/me endpoint.
 * Deliberately excludes the password hash.
 */
public record AdminUserView(
        int userId,
        String name,
        String userName,
        String email,
        Long phoneNum,
        String profilePicture,
        String role,
        String stripeAccountId
) {
    public static AdminUserView from(User u) {
        return new AdminUserView(
                u.getUserId(),
                u.getName(),
                u.getUserName(),
                u.getEmail(),
                u.getPhoneNum(),
                u.getProfilePicture(),
                Role.normalize(u.getRole()),
                u.getStripeAccountId()
        );
    }
}
