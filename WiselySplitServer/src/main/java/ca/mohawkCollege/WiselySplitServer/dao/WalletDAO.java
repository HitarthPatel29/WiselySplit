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

    public int insertWallet(Integer userId, String walletName, String walletType, String walletColor) {
        String sql = "INSERT INTO Wallets (UserID, Name, Type, Color) VALUES (?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, userId);
            ps.setString(2, walletName);
            ps.setString(3, walletType);
            ps.setString(4, walletColor);
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
                w.Type AS walletType,
                w.Color AS walletColor
            FROM Wallets w
            WHERE w.UserID = ?
        """;
        return jdbcTemplate.queryForList(sql, userId);
    }

    public void updateWallet(int userId, int walletId, String walletName, String walletType, String walletColor) {
        String sql = "UPDATE Wallets SET Name=?, Type=?, Color=? WHERE WalletID=? AND UserID=?";
        jdbcTemplate.update(sql, walletName, walletType, walletColor, walletId, userId);
    }

    public void deleteWallet(int userId, int walletId) {
        jdbcTemplate.update("DELETE FROM Wallets WHERE WalletID = ? AND UserID = ?", walletId, userId);
    }
}
