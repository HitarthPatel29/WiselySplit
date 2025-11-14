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
    @Autowired
    private ExpensesDAO expensesDAO;

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
                g.GroupType AS type,
                g.ProfilePicture AS profilePicture,
                COALESCE(SUM(
                    CASE
                        WHEN e.PayerID = ? AND ep.UserID <> ? THEN ep.Contribution
                        WHEN ep.UserID = ? AND e.PayerID <> ? THEN -ep.Contribution
                        ELSE 0
                    END
                ), 0) AS NetBalance
            FROM ExpenseGroups g
            JOIN GroupParticipants gp ON g.GroupID = gp.GroupID
            LEFT JOIN Expenses e ON e.GroupID = g.GroupID
            LEFT JOIN ExpenseParticipation ep ON ep.ExpenseID = e.ExpenseID
            WHERE gp.UserID = ?
            GROUP BY g.GroupID, g.GroupName, g.GroupType, g.ProfilePicture
            ORDER BY g.GroupName ASC
        """;
        return jdbcTemplate.queryForList(sql, userId, userId, userId, userId, userId);
    }
    public Map<String, Object> findGroupInfo(int groupId) {
        String sql = "SELECT GroupID AS groupId, GroupName AS name, GroupType AS type, ProfilePicture AS photo FROM ExpenseGroups WHERE GroupID = ?";
        return jdbcTemplate.queryForMap(sql, groupId);
    }

    public List<Map<String, Object>> findGroupExpenses(int groupId, int userId) {
        String sql = """
            SELECT
                e.ExpenseID AS expenseId,
                e.ExpenseTitle AS title,
                e.ExpenseDate AS date,
                e.Amount AS totalAmount,
                e.ExpenseType AS expenseType,
                p.Name AS paidBy,
                p.UserID AS payerId,
            
                -- Determine type from the POV of current user
                CASE WHEN e.PayerID = ? THEN 'lent' ELSE 'owe' END AS type
            
            FROM Expenses e
            JOIN User p ON e.PayerID = p.UserID
            WHERE e.GroupID = ?
            ORDER BY e.ExpenseDate DESC;
        """;

        List<Map<String,Object>> list = jdbcTemplate.queryForList(sql, userId, groupId);
        for (Map<String,Object> expense: list) {
            expense.put("splitDetails", expensesDAO.findExpenseParticipants((Integer) expense.get("expenseId")));
        }
        return list;
    }
    //  update group (partial: name, type, photo)
    public void updateGroup(int groupId, String name, String type, String profilePicture) {
        String sql;
        if (profilePicture == null){
            sql = "UPDATE ExpenseGroups SET GroupName = ?, GroupType = ? WHERE GroupID = ?";
            jdbcTemplate.update(sql, name, type, groupId);
        }else {
            sql = "UPDATE ExpenseGroups SET GroupName = ?, GroupType = ?, ProfilePicture = ? WHERE GroupID = ?";
            jdbcTemplate.update(sql, name, type, profilePicture, groupId);
        }

    }
    public List<Map<String, Object>> findGroupParticipantsWithBalances(int groupId, int currentUserId) {
        String sql = """
        SELECT
            u.UserID AS userId,
            u.Name AS name,
            u.Username AS username,
            u.ProfilePicture AS avatarUrl,
            COALESCE((
                SELECT SUM(
                    CASE
                        WHEN e.PayerID = ? AND ep.UserID = u.UserID THEN ep.Contribution
                        WHEN e.PayerID = u.UserID AND ep.UserID = ? THEN -ep.Contribution
                        ELSE 0
                    END
                )
                FROM Expenses e
                JOIN ExpenseParticipation ep ON ep.ExpenseID = e.ExpenseID
                WHERE e.GroupID = ?
            ), 0) AS netAmount
        FROM GroupParticipants gp
        JOIN User u ON gp.UserID = u.UserID
        WHERE gp.GroupID = ?
          AND u.UserID <> ?
        ORDER BY u.Name ASC
    """;

        List<Map<String, Object>> list = jdbcTemplate.queryForList(
                sql, currentUserId, currentUserId, groupId, groupId, currentUserId
        );

        for (Map<String, Object> row : list) {
            double net = ((Number) row.get("netAmount")).doubleValue();
            row.put("amount", Math.abs(net));
            String status;
            if (net > 0) {
                status = "lent";        // They owe you
            } else if (net < 0) {
                status = "owe";         // You owe them
            } else {
                status = "";
            }
            row.put("status", status);
            // Optional: remove internal field
            row.remove("netAmount");
        }

        return list;
    }
    public boolean isUserInGroup(int groupId, int userId) {
        String sql = "SELECT COUNT(*) FROM GroupParticipants WHERE GroupID = ? AND UserID = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, groupId, userId);
        return count != null && count > 0;
    }

    /* compute a user's net balance in a given group (same logic as findGroupsForUser but per-group)*/
    public double getUserNetBalanceInGroup(int groupId, int userId) {
        String sql = """
        SELECT COALESCE(SUM(
            CASE
                WHEN e.PayerID = ? AND ep.UserID <> ? THEN ep.Contribution
                WHEN ep.UserID = ? AND e.PayerID <> ? THEN -ep.Contribution
                ELSE 0
            END
        ), 0) AS NetBalance
        FROM ExpenseGroups g
        JOIN GroupParticipants gp ON g.GroupID = gp.GroupID
        LEFT JOIN Expenses e ON e.GroupID = g.GroupID
        LEFT JOIN ExpenseParticipation ep ON ep.ExpenseID = e.ExpenseID
        WHERE gp.UserID = ?
          AND g.GroupID = ?
    """;

        Double net = jdbcTemplate.queryForObject(sql, Double.class, userId, userId, userId, userId, userId, groupId
        );
        return net != null ? net : 0.0;
    }

     /*remove a participant from a group*/
    public void removeParticipant(int groupId, int userId) {
        String sql = "DELETE FROM GroupParticipants WHERE GroupID = ? AND UserID = ?";
        jdbcTemplate.update(sql, groupId, userId);
    }

      /*get all participant IDs of a group*/
    public List<Integer> findParticipantIds(int groupId) {
        String sql = "SELECT UserID FROM GroupParticipants WHERE GroupID = ?";
        return jdbcTemplate.queryForList(sql, Integer.class, groupId);
    }

    /*delete a group and related data*/
    public void deleteGroup(int groupId) {
        // Adjust order depending on your foreign key constraints (or use ON DELETE CASCADE)

        // Delete participation rows for expenses in this group
        String deleteParticipation = """
        DELETE ep FROM ExpenseParticipation ep
        JOIN Expenses e ON ep.ExpenseID = e.ExpenseID
        WHERE e.GroupID = ?
    """;
        jdbcTemplate.update(deleteParticipation, groupId);

        // Delete expenses in this group
        String deleteExpenses = "DELETE FROM Expenses WHERE GroupID = ?";
        jdbcTemplate.update(deleteExpenses, groupId);

        // Delete participants
        String deleteParticipants = "DELETE FROM GroupParticipants WHERE GroupID = ?";
        jdbcTemplate.update(deleteParticipants, groupId);

        // Finally delete the group
        String deleteGroup = "DELETE FROM ExpenseGroups WHERE GroupID = ?";
        jdbcTemplate.update(deleteGroup, groupId);
    }
}