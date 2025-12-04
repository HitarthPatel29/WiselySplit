package ca.mohawkCollege.WiselySplitServer.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.util.Map;
import java.util.Optional;

@Repository
public class PaymentDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** Insert Payment with Stripe fields and return PaymentID */
    public Integer addPayment(
            double amount,
            Integer payerId,
            Integer receiverId,
            String stripePaymentIntentId,
            String stripeTransferId,
            String status
    ) {
        String sql = """
            INSERT INTO Payments (Amount, PayerID, ReceiverID, PaymentDate, StripePaymentIntentId, StripeTransferId, Status)
            VALUES (?, ?, ?, NOW(), ?, ?, ?)
        """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setDouble(1, amount);
            ps.setInt(2, payerId);
            ps.setInt(3, receiverId);
            if (stripePaymentIntentId != null) {
                ps.setString(4, stripePaymentIntentId);
            } else {
                ps.setNull(4, Types.VARCHAR);
            }
            if (stripeTransferId != null) {
                ps.setString(5, stripeTransferId);
            } else {
                ps.setNull(5, Types.VARCHAR);
            }
            ps.setString(6, status != null ? status : "PENDING");
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    /** Update Payment with Stripe fields */
    public void updatePayment(
            int paymentId,
            String stripePaymentIntentId,
            String stripeTransferId,
            String status
    ) {
        String sql = """
            UPDATE Payments 
            SET StripePaymentIntentId = ?, StripeTransferId = ?, Status = ?
            WHERE PaymentID = ?
        """;

        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql);
            if (stripePaymentIntentId != null) {
                ps.setString(1, stripePaymentIntentId);
            } else {
                ps.setNull(1, Types.VARCHAR);
            }
            if (stripeTransferId != null) {
                ps.setString(2, stripeTransferId);
            } else {
                ps.setNull(2, Types.VARCHAR);
            }
            ps.setString(3, status);
            ps.setInt(4, paymentId);
            return ps;
        });
    }

    /** Find Payment by ID */
    public Optional<Map<String, Object>> findPaymentById(int paymentId) {
        String sql = """
            SELECT 
                PaymentID AS paymentId,
                Amount AS amount,
                PayerID AS payerId,
                ReceiverID AS receiverId,
                PaymentDate AS paymentDate,
                StripePaymentIntentId AS stripePaymentIntentId,
                StripeTransferId AS stripeTransferId,
                Status AS status
            FROM Payments
            WHERE PaymentID = ?
        """;
        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, paymentId);
            return Optional.of(result);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /** Find Payment by Stripe Payment Intent ID */
    public Optional<Map<String, Object>> findPaymentByStripePaymentIntentId(String stripePaymentIntentId) {
        String sql = """
            SELECT 
                PaymentID AS paymentId,
                Amount AS amount,
                PayerID AS payerId,
                ReceiverID AS receiverId,
                PaymentDate AS paymentDate,
                StripePaymentIntentId AS stripePaymentIntentId,
                StripeTransferId AS stripeTransferId,
                Status AS status
            FROM Payments
            WHERE StripePaymentIntentId = ?
        """;
        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, stripePaymentIntentId);
            return Optional.of(result);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}

