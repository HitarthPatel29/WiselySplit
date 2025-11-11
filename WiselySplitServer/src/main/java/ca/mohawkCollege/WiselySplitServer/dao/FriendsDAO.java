package ca.mohawkCollege.WiselySplitServer.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class FriendsDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> findFriendsBalances(int userId) {
        String sql = """
            SELECT 
                u.UserID   AS friendId,
                u.Name     AS name,
                u.UserName AS username,
                u.ProfilePicture,
                SUM(t.balance) AS NetBalance
            FROM (
                -- Case 1: user is the payer (others owe them)
                SELECT 
                    ep.UserID AS friendId,
                    ep.Contribution AS balance
                FROM Expenses e
                INNER JOIN ExpenseParticipation ep ON e.ExpenseID = ep.ExpenseID
                WHERE e.PayerID = ?

                UNION ALL

                -- Case 2: user is a participant (they owe payer)
                SELECT 
                    e.PayerID AS friendId,
                    -ep.Contribution AS balance
                FROM Expenses e
                INNER JOIN ExpenseParticipation ep ON e.ExpenseID = ep.ExpenseID
                WHERE ep.UserID = ?
            ) AS t
            INNER JOIN User u ON u.UserID = t.friendId
            GROUP BY u.UserID, u.Name, u.UserName, u.ProfilePicture
            HAVING SUM(t.balance) <> 0
        """;

        try {
            return jdbcTemplate.queryForList(sql, userId, userId);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("SQL error in FriendsDAO.findFriendsBalances(): " + e.getMessage());
        }
    }

    public List<Map<String, Object>> findSharedExpenses(int userId, int friendId) {
        String sql = """
        SELECT 
            e.ExpenseID AS expenseId,
            e.ExpenseTitle AS expenseTitle,
            e.ExpenseDate AS expenseDate,
            e.ExpenseType AS expenseType,
            e.Amount AS amount,
            p.Name AS paidBy,
            CASE
                WHEN e.PayerID = ? THEN 'lent'
                WHEN ep.UserID = ? THEN 'owe'
                ELSE 'shared'
            END AS type,
            CASE
                WHEN e.PayerID = ? THEN CONCAT('You lent ', f.Name)
                WHEN ep.UserID = ? THEN CONCAT('You owe ', p.Name)
                ELSE 'Shared Group'
            END AS subtitle,
            CASE
                WHEN e.PayerID = ? THEN ep.Contribution
                WHEN ep.UserID = ? THEN -ep.Contribution
                ELSE 0
            END AS balance
        FROM Expenses e
        JOIN ExpenseParticipation ep ON e.ExpenseID = ep.ExpenseID
        JOIN User p ON e.PayerID = p.UserID
        JOIN User f ON ep.UserID = f.UserID
        WHERE (e.PayerID = ? AND ep.UserID = ?)
           OR (e.PayerID = ? AND ep.UserID = ?)
        ORDER BY e.ExpenseDate DESC
    """;

        return jdbcTemplate.queryForList(sql,
                userId, userId, userId, userId, userId, userId,
                userId, friendId, friendId, userId);
    }

}