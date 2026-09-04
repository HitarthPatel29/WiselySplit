package ca.mohawk_college.wiselysplit_server.jpa.support;

import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthenticatedUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

/**
 * Puts an {@link AuthenticatedUser} into {@link SecurityContextHolder} for unit tests.
 * Always call {@link #clearContext()} in {@code @AfterEach}.
 */
public final class SecurityTestSupport {

    private SecurityTestSupport() {}

    public static AuthenticatedUser asUser(long userId) {
        return authenticate(userId, "user" + userId + "@example.com", "ROLE_USER");
    }

    public static AuthenticatedUser asAdmin(long userId) {
        return authenticate(userId, "admin" + userId + "@example.com", "ROLE_ADMIN");
    }

    public static void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private static AuthenticatedUser authenticate(long userId, String email, String role) {
        AuthenticatedUser principal = new AuthenticatedUser(
                userId, email, "n/a", List.of(new SimpleGrantedAuthority(role)));
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return principal;
    }
}
