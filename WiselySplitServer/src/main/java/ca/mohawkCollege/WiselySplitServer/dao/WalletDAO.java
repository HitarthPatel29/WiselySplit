package ca.mohawkCollege.WiselySplitServer.dao;

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

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public int insertWallet(Integer userId, String walletName, double walletBalance, String walletType, String walletColor) {
        String sql = "INSERT INTO Wallets (UserID, Name, Balance, Type, Color) VALUES (?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, userId);
            ps.setString(2, walletName);
            ps.setDouble(3, walletBalance);
            ps.setString(4, walletType);
            ps.setString(5, walletColor);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    public List<Map<String, Object>> getWallets(int userId) {
        String sql = """
            SELECT 
                w.WalletID AS walletId,
                w.Name AS walletName,
                w.Balance AS walletBalance,
                w.CardName AS cardName,
                w.Color AS walletColor
            FROM Wallets w
            WHERE w.UserID = ?
        """;
        return jdbcTemplate.queryForList(sql, userId);
    }

    public Map<String, Object> getWalletId(String walletName, int userId){
        String sql = """
                SELECT
                    w.WalletID AS walletId
                FROM Wallets w
                WHERE w.CardName = ? AND w.UserID = ?
            """;
        return jdbcTemplate.queryForMap(sql, walletName, userId);
    }

    public void updateWallet(int userId, int walletId, String walletName, double walletBalance, String walletType, String walletColor) {
        String sql = "UPDATE Wallets SET Name=?, Balance=?, Type=?, Color=? WHERE WalletID=? AND UserID=?";
        jdbcTemplate.update(sql, walletName, walletBalance, walletType, walletColor, walletId, userId);
    }

    public void deleteWallet(int userId, int walletId) {
        jdbcTemplate.update("DELETE FROM Wallets WHERE WalletID = ? AND UserID = ?", walletId, userId);
    }
}
