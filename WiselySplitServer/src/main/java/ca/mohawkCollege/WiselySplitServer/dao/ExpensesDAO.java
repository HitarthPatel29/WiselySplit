package ca.mohawkCollege.WiselySplitServer.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.util.List;
import java.util.Map;

@Repository
public class ExpensesDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** Insert Expense and return ExpenseID */
    public int insertExpense(String title, String date, String type, double amount, int payerId, Integer groupId) {
        String sql = """
            INSERT INTO Expenses (ExpenseTitle, ExpenseDate, ExpenseType, Amount, PayerID, GroupID)
            VALUES (?, ?, ?, ?, ?, ?)
        """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, title);
            ps.setString(2, date);
            ps.setString(3, type);
            ps.setDouble(4, amount);
            ps.setInt(5, payerId);
            if (groupId != null) ps.setInt(6, groupId);
            else ps.setNull(6, Types.INTEGER);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    /**  Insert ExpenseParticipation records */
    public void insertExpenseParticipation(int expenseId, int userId, double contribution, double contributionPortion) {
        jdbcTemplate.update(
                "INSERT INTO ExpenseParticipation (ExpenseID, UserID, Contribution, ContributionPortion) VALUES (?, ?, ?, ?)",
                expenseId, userId, contribution, contributionPortion
        );
    }

    /**  Fetch Expense details */
    public Map<String, Object> findExpenseById(int expenseId) {
        String sql = """
            SELECT 
                e.ExpenseID AS expenseId,
                e.ExpenseTitle AS title,
                e.ExpenseDate AS date,
                e.ExpenseType AS type,
                e.Amount AS amount,
                e.GroupID AS groupId,
                u.Name AS payer,
                u.UserID AS payerId
            FROM Expenses e
            JOIN User u ON e.PayerID = u.UserID
            WHERE e.ExpenseID = ?
        """;
        return jdbcTemplate.queryForMap(sql, expenseId);
    }

    /**  Fetch Expense participants */
    public List<Map<String, Object>> findExpenseParticipants(int expenseId) {
        String sql = """
            SELECT 
                u.UserID AS userId,
                u.Name AS name,
                ep.Contribution AS amount,
                ep.ContributionPortion AS portions
            FROM ExpenseParticipation ep
            JOIN User u ON ep.UserID = u.UserID
            WHERE ep.ExpenseID = ?
        """;
        return jdbcTemplate.queryForList(sql, expenseId);
    }

    /** Personal Summary (Option 3: dateRange from backend, rest of filtering on FE) */
    public List<Map<String, Object>> fetchPersonalSummary(int userId, String startDate, String endDate) {

        String sql = """
        SELECT 
            e.ExpenseID AS expenseId,
            e.ExpenseTitle AS title,
            e.ExpenseDate AS date,
            e.ExpenseType AS type,
            e.Amount AS totalExpenseAmount,
            e.PayerID AS payerId,
            u.Name AS payerName,
            e.GroupID AS groupId,
            g.GroupName AS groupName,
            ep.Contribution AS userContribution,

            CASE 
                WHEN e.PayerID = ? THEN 1 
                ELSE 0 
            END AS isUserPayer,

            CASE 
                WHEN e.PayerID = ? THEN (ep.Contribution * -1) 
                ELSE ep.Contribution
            END AS netAmount

        FROM Expenses e
        JOIN ExpenseParticipation ep ON e.ExpenseID = ep.ExpenseID
        JOIN User u ON e.PayerID = u.UserID
        LEFT JOIN ExpenseGroups g ON e.GroupID = g.GroupID
        WHERE ep.UserID = ?
          AND e.ExpenseDate BETWEEN ? AND ?
        ORDER BY e.ExpenseDate DESC
        """;

        return jdbcTemplate.queryForList(sql, userId, userId, userId, startDate, endDate);
    }

    /**  Delete Expense + participation records */
    public void deleteExpense(int expenseId) {
        jdbcTemplate.update("DELETE FROM ExpenseParticipation WHERE ExpenseID = ?", expenseId);
        jdbcTemplate.update("DELETE FROM Expenses WHERE ExpenseID = ?", expenseId);
    }

    public void updateExpense(int expenseId, String title, String date, String type, double amount, int payerId, Integer groupId) {
        String sql = "UPDATE Expenses SET ExpenseTitle=?, ExpenseDate=?, ExpenseType=?, Amount=?, PayerID=?, GroupID=? WHERE ExpenseID=?";
        jdbcTemplate.update(sql, title, date, type, amount, payerId, groupId, expenseId);
    }

    public void deleteExpenseParticipation(int expenseId) {
        jdbcTemplate.update("DELETE FROM ExpenseParticipation WHERE ExpenseID = ?", expenseId);
    }
}