package ca.mohawk_college.wiselysplit_server.daos;

import jakarta.validation.groups.Default;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

@Repository
public class WalletDAO {

    public enum WalletBalanceUpdateMode{
        INCOME, EXPENSE
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public long insertWallet(Long userId, String walletName, double initialBalance, String cardName, String walletColor) {
        String sql = "INSERT INTO Wallets (UserID, Name, InitialBalance, CardName, Color) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId);
            ps.setString(2, walletName);
            ps.setDouble(3, initialBalance);
            ps.setString(4, cardName);
            ps.setString(5, walletColor);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    public void updateWalletBalance(Long userId, Long walletId, double amount, WalletBalanceUpdateMode mode){
        String sql = "";
        switch (mode) {
            case INCOME -> sql = "UPDATE Wallets SET Balance = Balance + ? WHERE WalletID = ? AND UserID = ?";
            case EXPENSE -> sql = "UPDATE Wallets SET Balance = Balance - ? WHERE WalletID = ? AND UserID = ?";
        }
        jdbcTemplate.update(sql, amount, walletId, userId);
    }
    public void updateWalletBalanceForEntryUpdate(Long userId, Long walletId, Long entryId, double amount, WalletBalanceUpdateMode mode){
        String sql = "";
        switch (mode) {
            case INCOME -> sql = "UPDATE Wallets SET Balance = Balance - (SELECT amount FROM Expenses WHERE expenseID = ?) + ? WHERE WalletID = ? AND UserID = ?";
            case EXPENSE -> sql = "UPDATE Wallets SET Balance = Balance + (SELECT amount FROM Expenses WHERE expenseID = ?) - ? WHERE WalletID = ? AND UserID = ?";
        }
        jdbcTemplate.update(sql, entryId, amount, walletId, userId);
    }
    public void updateWalletBalanceForEntryDelete(Long entryId, WalletBalanceUpdateMode mode){
        String sql = "";
        switch (mode) {
            case INCOME -> sql = "UPDATE Wallets SET Balance = Balance - (SELECT amount FROM Expenses WHERE expenseID = ?) WHERE WalletID = (SELECT walletID FROM Expenses WHERE expenseID = ?)";
            case EXPENSE -> sql = "UPDATE Wallets SET Balance = Balance + (SELECT amount FROM Expenses WHERE expenseID = ?) WHERE WalletID = (SELECT walletID FROM Expenses WHERE expenseID = ?)";
        }
        jdbcTemplate.update(sql, entryId, entryId);
    }
    public void updateWalletBalanceForTransferDelete(Long entryId){
        String sql = """
                        UPDATE Wallets w
                        JOIN Entry e
                            ON w.WalletID = e.WalletID
                            OR w.WalletID = e.ToWalletID
                        SET w.Balance = CASE
                            WHEN w.WalletID = e.WalletID     THEN w.Balance + e.Amount
                            WHEN w.WalletID = e.ToWalletID   THEN w.Balance - e.Amount
                        END
                        WHERE e.EntryID = ?;
                """;
        jdbcTemplate.update(sql, entryId);
    }

    public List<Map<String, Object>> getWallets(long userId) {
        String sql = """
            SELECT
                w.WalletID AS walletId,
                w.Name AS walletName,
                w.Balance AS walletBalance,
                w.InitialBalance AS initialBalance,
                w.CardName AS cardName,
                w.Color AS walletColor
            FROM Wallets w
            WHERE w.UserID = ?
        """;
        return jdbcTemplate.queryForList(sql, userId);
    }

    /** Get WalletID by matching cardName while ignoring spaces and letter casing*/
    public Map<String, Object> getWalletId(String walletName, long userId){
        String sql = """
                SELECT
                    w.WalletID AS walletId
                FROM Wallets w
                WHERE REPLACE(LOWER(w.CardName), ' ', '') = REPLACE(LOWER(?), ' ', '') AND w.UserID = ?
            """;
        return jdbcTemplate.queryForMap(sql, walletName, userId);
    }

    public void updateWallet(long userId, long walletId, String walletName, double initialBalance, String cardName, String walletColor) {
        String sql = "UPDATE Wallets SET Name=?, Balance=Balance-InitialBalance+?, InitialBalance=?, CardName=?, Color=? WHERE WalletID=? AND UserID=?";
        jdbcTemplate.update(sql, walletName, initialBalance, initialBalance, cardName, walletColor, walletId, userId);
    }

    public void deleteWallet(long userId, long walletId) {
        jdbcTemplate.update("DELETE FROM Wallets WHERE WalletID = ? AND UserID = ?", walletId, userId);
    }
}
