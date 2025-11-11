package ca.mohawkCollege.WiselySplitServer.dao;

import ca.mohawkCollege.WiselySplitServer.RowMappers.InviteRowMapper;
import ca.mohawkCollege.WiselySplitServer.model.Invite;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public class InviteDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public int create(Invite invite) {
        String sql = """
            INSERT INTO Invites (SenderID, ReceiverID, ReceiverEmail, GroupID, Type, Status, ExpiresAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
        return jdbcTemplate.update(sql,
                invite.getSenderId(),
                invite.getReceiverId(),
                invite.getReceiverEmail(),
                invite.getGroupId(),
                invite.getType(),
                invite.getStatus(),
                invite.getExpiresAt());
    }

    public Map<String, Object> findById(int inviteId) {
        String sql = "SELECT * FROM Invites WHERE InviteID = ?";
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, inviteId);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<Invite> findByReceiverId(int receiverId) {
        String sql = "SELECT * FROM Invites WHERE ReceiverID = ?";
        return jdbcTemplate.query(sql, new InviteRowMapper(), receiverId);
    }

    public List<Invite> findByReceiverEmail(String email) {
        String sql = "SELECT * FROM Invites WHERE ReceiverEmail = ?";
        return jdbcTemplate.query(sql, new InviteRowMapper(), email);
    }

    public boolean existsPending(int senderId, String email, Integer groupId) {
        String sql = """
            SELECT COUNT(*) FROM Invites
            WHERE SenderID=? AND ReceiverEmail=? AND COALESCE(GroupID,0)=COALESCE(?,0)
            AND Status='PENDING'
        """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, senderId, email, groupId);
        return count != null && count > 0;
    }

    public void linkInvitesToUser(String email, int userId) {
        String sql = "UPDATE Invites SET ReceiverID=? WHERE ReceiverEmail=? AND ReceiverID IS NULL";
        jdbcTemplate.update(sql, userId, email);
    }

    public void updateStatus(int inviteId, String status) {
        String sql = "UPDATE Invites SET Status=? WHERE InviteID=?";
        jdbcTemplate.update(sql, status, inviteId);
    }

    public List<Map<String, Object>> findAllForUser(int userId) {
        String sql = """
            SELECT i.InviteID, i.SenderID, i.ReceiverID, i.ReceiverEmail,
                   i.Type, i.Status, i.CreatedAt, i.ExpiresAt,
                   s.Name AS SenderName, s.Email AS SenderEmail, s.ProfilePicture AS SenderPicture,
                   r.Name AS ReceiverName, r.Email AS ReceiverEmailFull, r.ProfilePicture AS ReceiverPicture
            FROM Invites i
            LEFT JOIN User s ON i.SenderID = s.UserID
            LEFT JOIN User r ON i.ReceiverID = r.UserID
            WHERE i.SenderID = ? OR i.ReceiverID = ?
            ORDER BY i.CreatedAt DESC
        """;
        return jdbcTemplate.queryForList(sql, userId, userId);
    }

    public void markExpiredInvites() {
        String sql = """
            UPDATE Invites
            SET Status = 'EXPIRED'
            WHERE Status = 'PENDING' AND ExpiresAt < CURRENT_TIMESTAMP
        """;
        jdbcTemplate.update(sql);
    }
}