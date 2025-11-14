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
            GROUP BY g.GroupID, g.GroupName, g.ProfilePicture
            ORDER BY g.GroupName ASC
        """;
        return jdbcTemplate.queryForList(sql, userId, userId, userId, userId, userId);
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
}