package ca.mohawkCollege.wiselySplitServer.utilities.auth;

import ca.mohawkCollege.wiselySplitServer.services.RefreshTokenService.IssuedRefreshToken;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Builds and reads the HttpOnly refresh-token cookie.
 * The cookie is scoped to /api/auth so it is only sent to the refresh/logout endpoints,
 * and is host-only (no Domain attribute) so it never leaks to sibling subdomains.
 */
@Component
public class RefreshCookieUtil {

    private static final String COOKIE_PATH = "/api/auth";

    private final String cookieName;
    private final boolean secure;
    private final String sameSite;

    public RefreshCookieUtil(
            @Value("${security.refresh.cookie-name:refresh_token}") String cookieName,
            @Value("${security.refresh.cookie-secure:true}") boolean secure,
            @Value("${security.refresh.cookie-same-site:Lax}") String sameSite
    ) {
        this.cookieName = cookieName;
        this.secure = secure;
        this.sameSite = sameSite;
    }

    /**
     * "Remember me" sessions get a persistent cookie that lives until the DB expiry;
     * otherwise a browser-session cookie that disappears when the browser closes.
     */
    public ResponseCookie build(IssuedRefreshToken token) {
        ResponseCookie.ResponseCookieBuilder builder = baseCookie(token.rawToken());
        if (token.remember()) {
            Duration remaining = Duration.between(LocalDateTime.now(), token.expiresAt());
            builder.maxAge(remaining.isNegative() ? Duration.ZERO : remaining);
        }
        return builder.build();
    }

    public ResponseCookie clear() {
        return baseCookie("").maxAge(Duration.ZERO).build();
    }

    public String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(COOKIE_PATH);
    }
}
