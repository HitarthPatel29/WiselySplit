package ca.mohawkCollege.wiselySplitServer.rowMappers;

import ca.mohawkCollege.wiselySplitServer.models.RefreshToken;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;

public class RefreshTokenRowMapper implements RowMapper<RefreshToken> {
    @Override
    public RefreshToken mapRow(ResultSet rs, int rowNum) throws SQLException {
        RefreshToken token = new RefreshToken();
        token.setTokenId(rs.getLong("TokenID"));
        token.setUserId(rs.getLong("UserID"));
        token.setTokenHash(rs.getString("TokenHash"));
        token.setFamilyId(rs.getString("FamilyID"));
        token.setRemember(rs.getBoolean("Remember"));
        token.setExpiresAt(toLocal(rs.getTimestamp("ExpiresAt")));
        token.setCreatedAt(toLocal(rs.getTimestamp("CreatedAt")));
        token.setRevokedAt(toLocal(rs.getTimestamp("RevokedAt")));
        long replacedBy = rs.getLong("ReplacedByID");
        token.setReplacedById(rs.wasNull() ? null : replacedBy);
        token.setUserAgent(rs.getString("UserAgent"));
        token.setIpAddress(rs.getString("IpAddress"));
        return token;
    }

    private static LocalDateTime toLocal(Timestamp ts) {
        return ts == null ? null : ts.toLocalDateTime();
    }
}
