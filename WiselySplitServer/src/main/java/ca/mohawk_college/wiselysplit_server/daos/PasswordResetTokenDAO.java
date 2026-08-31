package ca.mohawk_college.wiselysplit_server.daos;

import ca.mohawk_college.wiselysplit_server.rowMappers.PasswordResetTokenRowMapper;
import ca.mohawk_college.wiselysplit_server.models.PasswordResetToken;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class PasswordResetTokenDAO {

    private final JdbcTemplate jdbcTemplate;

    public PasswordResetTokenDAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(PasswordResetToken token) {
        String sql = "INSERT INTO password_reset_tokens (user_id, otp_hash, expires_at, attempts, consumed_at) " +
                "VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                token.getUserId(),
                token.getOtpHash(),
                token.getExpiresAt(),
                token.getAttempts(),
                token.getConsumedAt());
    }

    public Optional<PasswordResetToken> findByUserId(long userId) {
        String sql = "SELECT * FROM password_reset_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1";
        return jdbcTemplate.query(sql, new PasswordResetTokenRowMapper(), userId)
                .stream()
                .findFirst();
    }

    public void markConsumed(long id) {
        String sql = "UPDATE password_reset_tokens SET consumed_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    public void incrementAttempts(long id) {
        String sql = "UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}