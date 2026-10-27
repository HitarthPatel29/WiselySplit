package ca.mohawk_college.wiselysplit_server.services;

import ca.mohawk_college.wiselysplit_server.daos.RefreshTokenDAO;
import ca.mohawk_college.wiselysplit_server.daos.UserDAO;
import ca.mohawk_college.wiselysplit_server.exceptions.InvalidRefreshTokenException;
import ca.mohawk_college.wiselysplit_server.models.RefreshToken;
import ca.mohawk_college.wiselysplit_server.models.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Issues, rotates and revokes opaque refresh tokens.
 * Only the SHA-256 hash of a token is persisted; the raw value lives in the
 * client's HttpOnly cookie. Access tokens remain stateless JWTs.
 */
@Service
public class RefreshTokenService {

    /** A rotated token replayed within this window is treated as a concurrent-tab race, not theft. */
    private static final Duration REUSE_GRACE = Duration.ofSeconds(30);
    private static final int TOKEN_BYTES = 32;

    private final RefreshTokenDAO refreshTokenDAO;
    private final UserDAO userDAO;
    private final Duration ttl;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenDAO refreshTokenDAO,
                               UserDAO userDAO,
                               @Value("${security.refresh.ttl-days:30}") long ttlDays) {
        this.refreshTokenDAO = refreshTokenDAO;
        this.userDAO = userDAO;
        this.ttl = Duration.ofDays(ttlDays);
    }

    /** Raw refresh token handed to the client, plus what the cookie needs to mirror the DB row. */
    public record IssuedRefreshToken(String rawToken, LocalDateTime expiresAt, boolean remember) {}

    public record RotationResult(User user, IssuedRefreshToken refreshToken) {}

    /** Starts a new login session (new token family) for the user. */
    @Transactional
    public IssuedRefreshToken issue(User user, boolean remember, HttpServletRequest request) {
        LocalDateTime now = LocalDateTime.now();
        return insertToken(user.getUserId(), UUID.randomUUID().toString(), remember, now.plus(ttl), now, request)
                .issued();
    }

    /**
     * Exchanges a valid refresh token for a new one in the same family.
     * Replaying an already-rotated token outside the grace window revokes the whole family.
     */
    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public RotationResult rotate(String rawToken, HttpServletRequest request) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidRefreshTokenException("Missing refresh token");
        }
        LocalDateTime now = LocalDateTime.now();
        RefreshToken current = refreshTokenDAO.findByHash(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("Unknown refresh token"));

        if (current.isRevoked()) {
            boolean recentlyRotated = current.getReplacedById() != null
                    && current.getRevokedAt().plus(REUSE_GRACE).isAfter(now);
            if (recentlyRotated) {
                throw new InvalidRefreshTokenException("Refresh token was just rotated", false);
            }
            refreshTokenDAO.revokeFamily(current.getFamilyId(), now);
            throw new InvalidRefreshTokenException("Refresh token has been revoked");
        }

        if (current.isExpired(now)) {
            refreshTokenDAO.revokeIfActive(current.getTokenId(), null, now);
            throw new InvalidRefreshTokenException("Refresh token has expired");
        }

        User user = userDAO.findById(current.getUserId())
                .orElseThrow(() -> new InvalidRefreshTokenException("User no longer exists"));

        // Claim the old token atomically; a concurrent request that already rotated it wins.
        if (refreshTokenDAO.revokeIfActive(current.getTokenId(), null, now) == 0) {
            throw new InvalidRefreshTokenException("Refresh token was just rotated", false);
        }

        StoredToken next = insertToken(current.getUserId(), current.getFamilyId(),
                current.isRemember(), current.getExpiresAt(), now, request);
        refreshTokenDAO.setReplacedBy(current.getTokenId(), next.tokenId());

        return new RotationResult(user, next.issued());
    }

    /** Logs out the single session (token family) that the given token belongs to. */
    @Transactional
    public void revokeByRawToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        refreshTokenDAO.findByHash(hash(rawToken))
                .ifPresent(t -> refreshTokenDAO.revokeFamily(t.getFamilyId(), LocalDateTime.now()));
    }

    /** Logs the user out of every device. */
    @Transactional
    public void revokeAllForUser(long userId) {
        refreshTokenDAO.revokeAllForUser(userId, LocalDateTime.now());
    }

    /** Daily purge of rows that expired more than a week ago. */
    @Scheduled(cron = "0 0 3 * * *")
    public void purgeExpired() {
        refreshTokenDAO.deleteExpiredBefore(LocalDateTime.now().minusDays(7));
    }

    private record StoredToken(long tokenId, IssuedRefreshToken issued) {}

    private StoredToken insertToken(long userId, String familyId, boolean remember,
                                           LocalDateTime expiresAt, LocalDateTime now,
                                           HttpServletRequest request) {
        String rawToken = generateRawToken();

        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setTokenHash(hash(rawToken));
        token.setFamilyId(familyId);
        token.setRemember(remember);
        token.setExpiresAt(expiresAt);
        token.setCreatedAt(now);
        if (request != null) {
            token.setUserAgent(truncate(request.getHeader("User-Agent"), 255));
            token.setIpAddress(truncate(request.getRemoteAddr(), 45));
        }
        long tokenId = refreshTokenDAO.insert(token);

        return new StoredToken(tokenId, new IssuedRefreshToken(rawToken, expiresAt, remember));
    }

    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
