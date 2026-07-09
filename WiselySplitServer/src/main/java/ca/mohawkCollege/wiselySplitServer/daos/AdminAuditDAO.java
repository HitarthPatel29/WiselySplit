package ca.mohawkCollege.wiselySplitServer.daos;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * Lightweight audit trail for privileged admin actions
 * (role changes, account CRUD, password resets).
 */
@Repository
public class AdminAuditDAO {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public AdminAuditDAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void record(Integer actorUserId, String actorEmail, String action, Integer targetUserId, String details) {
        String sql = "INSERT INTO admin_audit (ActorUserId, ActorEmail, Action, TargetUserId, Details) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, actorUserId, actorEmail, action, targetUserId, details);
    }

    public List<Map<String, Object>> findRecent(int limit, int offset) {
        String sql = "SELECT Id, ActorUserId, ActorEmail, Action, TargetUserId, Details, CreatedAt " +
                "FROM admin_audit ORDER BY CreatedAt DESC, Id DESC LIMIT ? OFFSET ?";
        return jdbcTemplate.queryForList(sql, limit, offset);
    }

    public int countAll() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM admin_audit", Integer.class);
        return count == null ? 0 : count;
    }
}
