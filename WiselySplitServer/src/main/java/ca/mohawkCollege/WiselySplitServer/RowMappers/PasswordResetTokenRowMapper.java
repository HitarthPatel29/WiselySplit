package ca.mohawkCollege.WiselySplitServer.RowMappers;

import ca.mohawkCollege.WiselySplitServer.model.PasswordResetToken;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class PasswordResetTokenRowMapper implements RowMapper<PasswordResetToken> {
    @Override
    public PasswordResetToken mapRow(ResultSet rs, int rowNum) throws SQLException {
        PasswordResetToken token = new PasswordResetToken();
        token.setId(rs.getInt("id"));
        token.setUserId(rs.getInt("user_id"));
        token.setOtpHash(rs.getString("otp_hash"));
        token.setExpiresAt(rs.getTimestamp("expires_at").toLocalDateTime());
        token.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        token.setAttempts(rs.getInt("attempts"));
        token.setConsumedAt(rs.getTimestamp("consumed_at") != null
                ? rs.getTimestamp("consumed_at").toLocalDateTime()
                : null);
        return token;
    }
}