package ca.mohawkCollege.WiselySplitServer.RowMappers;

import ca.mohawkCollege.WiselySplitServer.model.Invite;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class InviteRowMapper implements RowMapper<Invite> {
    @Override
    public Invite mapRow(ResultSet rs, int rowNum) throws SQLException {
        Invite i = new Invite();
        i.setInviteId(rs.getInt("InviteID"));
        i.setSenderId(rs.getInt("SenderID"));
        i.setReceiverId((Integer) rs.getObject("ReceiverID"));
        i.setReceiverEmail(rs.getString("ReceiverEmail"));
        i.setGroupId((Integer) rs.getObject("GroupID"));
        i.setType(rs.getString("Type"));
        i.setStatus(rs.getString("Status"));
        i.setCreatedAt(rs.getTimestamp("CreatedAt"));
        i.setExpiresAt(rs.getTimestamp("ExpiresAt"));
        return i;
    }
}