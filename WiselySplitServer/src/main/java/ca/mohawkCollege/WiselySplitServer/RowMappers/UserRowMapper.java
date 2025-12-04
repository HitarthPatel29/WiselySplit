package ca.mohawkCollege.WiselySplitServer.RowMappers;

import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class UserRowMapper implements RowMapper<User> {
    @Override
    public User mapRow(ResultSet rs, int rowNum) throws SQLException {
        User user = new User();
        user.setUserId(rs.getInt("UserID"));
        user.setName(rs.getString("Name"));
        user.setUserName(rs.getString("UserName"));
        user.setEmail(rs.getString("Email"));
        user.setPhoneNum(rs.getLong("PhoneNum"));
        user.setPassword(rs.getString("Password"));
        user.setProfilePicture(rs.getString("ProfilePicture"));
        // Handle StripeAccountId - may be null
        String stripeAccountId = rs.getString("StripeAccountId");
        if (rs.wasNull()) {
            user.setStripeAccountId(null);
        } else {
            user.setStripeAccountId(stripeAccountId);
        }
        return user;
    }
}
