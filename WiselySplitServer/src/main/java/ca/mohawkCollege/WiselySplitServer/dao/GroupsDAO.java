package ca.mohawkCollege.WiselySplitServer.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class GroupsDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public int insertGroup(String name, String type, String profilePicture) {
        String sql = "INSERT INTO ExpenseGroups (GroupName, GroupType, ProfilePicture) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, name, type, profilePicture);

        // Return the generated GroupID
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
    }

    public void addParticipant(int groupId, int userId) {
        String sql = "INSERT INTO GroupParticipants (GroupID, UserID) VALUES (?, ?)";
        jdbcTemplate.update(sql, groupId, userId);
    }

    public List<Map<String, Object>> findGroupsForUser(int userId) {
        String sql = """
            SELECT 
                g.GroupID AS groupId,
                g.GroupName AS name,
                g.ProfilePicture AS profilePicture,
                COALESCE(SUM(
                    CASE
                        WHEN e.PayerID = ? THEN ep.Contribution
                        WHEN ep.UserID = ? THEN -ep.Contribution
                        ELSE 0
                    END
                ), 0) AS NetBalance
            FROM ExpenseGroups g
            JOIN GroupParticipants gp ON g.GroupID = gp.GroupID
            LEFT JOIN Expenses e ON e.GroupID = g.GroupID
            LEFT JOIN ExpenseParticipation ep ON e.ExpenseID = ep.ExpenseID
            WHERE gp.UserID = ?
            GROUP BY g.GroupID, g.GroupName, g.ProfilePicture
            ORDER BY g.GroupName ASC
        """;

        return jdbcTemplate.queryForList(sql, userId, userId, userId);
    }
    public Map<String, Object> findGroupInfo(int groupId) {
        String sql = "SELECT GroupID AS groupId, GroupName AS name, ProfilePicture FROM ExpenseGroups WHERE GroupID = ?";
        return jdbcTemplate.queryForMap(sql, groupId);
    }

    public List<Map<String, Object>> findGroupExpenses(int groupId, int userId) {
        String sql = """
        SELECT 
            e.ExpenseID AS expenseId,
            e.ExpenseTitle AS title,
            e.ExpenseDate AS date,
            e.Amount AS amount,
            p.Name AS paidBy,
            CASE
                WHEN e.PayerID = ? THEN 'lent'
                ELSE 'owe'
            END AS type,
            'Shared Group' AS subtitle
        FROM Expenses e
        JOIN User p ON e.PayerID = p.UserID
        WHERE e.GroupID = ?
        ORDER BY e.ExpenseDate DESC
    """;
        return jdbcTemplate.queryForList(sql, userId, groupId);
    }

    public List<Map<String, Object>> findGroupMemberStandings(int groupId, int userId) {
        String sql = """
        SELECT 
            u.UserID AS userId,
            u.Name AS memberName,
            SUM(
                CASE
                    WHEN e.PayerID = ? THEN ep.Contribution
                    WHEN ep.UserID = ? THEN -ep.Contribution
                    ELSE 0
                END
            ) AS balance
        FROM GroupParticipants gp
        JOIN User u ON gp.UserID = u.UserID
        LEFT JOIN Expenses e ON e.GroupID = gp.GroupID
        LEFT JOIN ExpenseParticipation ep ON ep.ExpenseID = e.ExpenseID AND ep.UserID = u.UserID
        WHERE gp.GroupID = ?
        GROUP BY u.UserID, u.Name
    """;
        return jdbcTemplate.queryForList(sql, userId, userId, groupId);
    }
}