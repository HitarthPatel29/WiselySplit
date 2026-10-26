package ca.mohawkCollege.wiselySplitServer.daos;

import ca.mohawkCollege.wiselySplitServer.models.RefreshToken;
import ca.mohawkCollege.wiselySplitServer.rowMappers.RefreshTokenRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class RefreshTokenDAO {

    private final JdbcTemplate jdbcTemplate;

    public RefreshTokenDAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Inserts the token and returns its generated TokenID. */
    public long insert(RefreshToken token) {
        String sql = "INSERT INTO RefreshToken (UserID, TokenHash, FamilyID, Remember, ExpiresAt, CreatedAt, UserAgent, IpAddress) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, token.getUserId());
            ps.setString(2, token.getTokenHash());
            ps.setString(3, token.getFamilyId());
            ps.setBoolean(4, token.isRemember());
            ps.setTimestamp(5, Timestamp.valueOf(token.getExpiresAt()));
            ps.setTimestamp(6, Timestamp.valueOf(token.getCreatedAt()));
            ps.setString(7, token.getUserAgent());
            ps.setString(8, token.getIpAddress());
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    public Optional<RefreshToken> findByHash(String tokenHash) {
        String sql = "SELECT * FROM RefreshToken WHERE TokenHash = ?";
        return jdbcTemplate.query(sql, new RefreshTokenRowMapper(), tokenHash)
                .stream()
                .findFirst();
    }

    /**
     * Revokes a single token only if it is still active.
     * Returns 0 when another request already revoked it (lost a rotation race).
     */
    public int revokeIfActive(long tokenId, Long replacedById, LocalDateTime now) {
        String sql = "UPDATE RefreshToken SET RevokedAt = ?, ReplacedByID = ? WHERE TokenID = ? AND RevokedAt IS NULL";
        return jdbcTemplate.update(sql, Timestamp.valueOf(now), replacedById, tokenId);
    }

    /** Links an already-revoked token to the row that replaced it. */
    public int setReplacedBy(long tokenId, long replacedById) {
        String sql = "UPDATE RefreshToken SET ReplacedByID = ? WHERE TokenID = ?";
        return jdbcTemplate.update(sql, replacedById, tokenId);
    }

    public int revokeFamily(String familyId, LocalDateTime now) {
        String sql = "UPDATE RefreshToken SET RevokedAt = ? WHERE FamilyID = ? AND RevokedAt IS NULL";
        return jdbcTemplate.update(sql, Timestamp.valueOf(now), familyId);
    }

    public int revokeAllForUser(long userId, LocalDateTime now) {
        String sql = "UPDATE RefreshToken SET RevokedAt = ? WHERE UserID = ? AND RevokedAt IS NULL";
        return jdbcTemplate.update(sql, Timestamp.valueOf(now), userId);
    }

    public int deleteExpiredBefore(LocalDateTime cutoff) {
        String sql = "DELETE FROM RefreshToken WHERE ExpiresAt < ?";
        return jdbcTemplate.update(sql, Timestamp.valueOf(cutoff));
    }
}
