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
    public int insertSharedExpense(
            String title,
            String date,
            String type,
            double amount,
            int payerId,
            Integer groupId,
            boolean isSettleUp,
            Integer paymentId,
            Integer walletId
    ) {
        String sql = """
            INSERT INTO Expenses (ExpenseTitle, ExpenseDate, ExpenseType, Amount, PayerID, GroupID, IsSettleUp, PaymentID, WalletID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            ps.setBoolean(7, isSettleUp);
            if (paymentId != null) ps.setInt(8, paymentId);
            else ps.setNull(8, Types.INTEGER);
            if (walletId != null) ps.setInt(9, walletId);
            else ps.setNull(9, Types.INTEGER);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    public int insertPersonalExpense(
            String title,
            String date,
            String type,
            double amount,
            int userId,
            Integer walletId,
            String entryKind,
            Integer toWalletId
    ) {
        String sql = """
            INSERT INTO Expenses (ExpenseTitle, ExpenseDate, ExpenseType, Amount, PayerID, IsPersonal, WalletID, EntryKind, ToWalletID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        String kind = (entryKind != null) ? entryKind : "expense";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, title);
            ps.setString(2, date);
            ps.setString(3, type);
            ps.setDouble(4, amount);
            ps.setInt(5, userId);
            ps.setBoolean(6, true);
            if (walletId != null) ps.setInt(7, walletId);
            else ps.setNull(7, Types.INTEGER);
            ps.setString(8, kind);
            if (toWalletId != null) ps.setInt(9, toWalletId);
            else ps.setNull(9, Types.INTEGER);
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
                e.IsSettleUp AS isSettleUp,
                e.PaymentID AS paymentId,
                e.GroupID AS groupId,
                e.IsPersonal AS isPersonal,
                e.WalletID AS payerWalletId,
                e.EntryKind AS entryKind,
                e.ToWalletID AS toWalletId,
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
            e.IsSettleUp AS isSettleUp,
            e.PaymentID AS paymentId,
            e.IsPersonal AS isPersonal,
            e.WalletID AS payerWalletId,
            e.EntryKind AS entryKind,
            e.ToWalletID AS toWalletId,
            COALESCE(ep.Contribution, 0) AS userContribution,
            CASE WHEN e.PayerID = ? THEN 1 ELSE 0 END AS isUserPayer,
            CASE 
                WHEN e.PayerID = ? THEN -COALESCE((
                    SELECT SUM(ep2.Contribution)
                    FROM ExpenseParticipation ep2
                    WHERE ep2.ExpenseID = e.ExpenseID
                      AND ep2.UserID != e.PayerID
                ), 0)
                ELSE COALESCE(ep.Contribution, 0)
            END AS netAmount
        FROM Expenses e
        LEFT JOIN ExpenseParticipation ep 
            ON ep.ExpenseID = e.ExpenseID 
            AND ep.UserID = ?
        JOIN User u ON u.UserID = e.PayerID
        LEFT JOIN ExpenseGroups g ON g.GroupID = e.GroupID
        WHERE 
            (ep.UserID = ? OR e.PayerID = ?)
            AND e.ExpenseDate BETWEEN ? AND ?
            AND e.ExpenseType != 'Fugazi'
        ORDER BY e.ExpenseDate DESC
        """;

        return jdbcTemplate.queryForList(sql, userId, userId, userId, userId, userId, startDate, endDate);
    }

    /**  Delete Expense + participation records */
    public void deleteExpense(int expenseId) {
        jdbcTemplate.update("DELETE FROM ExpenseParticipation WHERE ExpenseID = ?", expenseId);
        jdbcTemplate.update("DELETE FROM Expenses WHERE ExpenseID = ?", expenseId);
    }

    public void updateExpense(int expenseId, String title, String date, String type, double amount, int payerId, Integer groupId, boolean isPersonal, Integer walletId, String entryKind, Integer toWalletId) {
        String sql = "UPDATE Expenses SET ExpenseTitle=?, ExpenseDate=?, ExpenseType=?, Amount=?, PayerID=?, GroupID=?, IsPersonal=?, WalletID=?, EntryKind=?, ToWalletID=? WHERE ExpenseID=?";
        String kind = (entryKind != null) ? entryKind : "expense";
        jdbcTemplate.update(sql, title, date, type, amount, payerId, groupId, isPersonal, walletId, kind, toWalletId, expenseId);
    }

    public void deleteExpenseParticipation(int expenseId) {
        jdbcTemplate.update("DELETE FROM ExpenseParticipation WHERE ExpenseID = ?", expenseId);
    }

    public List<Map<String, Object>> getExpenseForWallet(int userId, int walletId) {
        String sql = """
            SELECT
                e.ExpenseID AS expenseId,
                e.ExpenseTitle AS title,
                e.ExpenseDate AS date,
                e.Amount AS totalAmount,
                e.ExpenseType AS expenseType,
                e.IsSettleUp AS isSettleUp,
                e.PaymentID AS paymentId,
                e.IsPersonal AS isPersonal,
                e.WalletID AS walletId,
                e.EntryKind AS entryKind,
                e.ToWalletID AS toWalletId,
                p.Name AS paidBy,
                p.UserID AS payerId,
            
                CASE
                    WHEN e.EntryKind = 'income' THEN 'income'
                    WHEN e.EntryKind = 'transfer' AND e.WalletID = ? THEN 'transfer_out'
                    WHEN e.EntryKind = 'transfer' AND e.ToWalletID = ? THEN 'transfer_in'
                    WHEN e.PayerID = ? THEN 'lent'
                    ELSE 'owe'
                END AS type
            
            FROM Expenses e
            JOIN User p ON e.PayerID = p.UserID
            WHERE e.WalletID = ? OR e.ToWalletID = ?
            ORDER BY e.ExpenseDate DESC
        """;

        List<Map<String,Object>> list = jdbcTemplate.queryForList(sql, walletId, walletId, userId, walletId, walletId);
        for (Map<String,Object> expense: list) {
            if (!(boolean) expense.get("isPersonal"))
                expense.put("splitDetails", findExpenseParticipants((Integer) expense.get("expenseId")));
        }
        return list;
    }
}