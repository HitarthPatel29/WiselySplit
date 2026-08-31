package ca.mohawk_college.wiselysplit_server.rowMappers;

import ca.mohawk_college.wiselysplit_server.models.Invite;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class InviteRowMapper implements RowMapper<Invite> {
    @Override
    public Invite mapRow(ResultSet rs, int rowNum) throws SQLException {
        Invite i = new Invite();
        i.setInviteId(rs.getLong("InviteID"));
        i.setSenderId(rs.getLong("SenderID"));
        long receiverId = rs.getLong("ReceiverID");
        i.setReceiverId(rs.wasNull() ? null : receiverId);
        i.setReceiverEmail(rs.getString("ReceiverEmail"));
        long groupId = rs.getLong("GroupID");
        i.setGroupId(rs.wasNull() ? null : groupId);
        i.setType(rs.getString("Type"));
        i.setStatus(rs.getString("Status"));
        i.setCreatedAt(rs.getTimestamp("CreatedAt"));
        i.setExpiresAt(rs.getTimestamp("ExpiresAt"));
        return i;
    }
}