package ca.mohawkCollege.WiselySplitServer.dao;

import ca.mohawkCollege.WiselySplitServer.RowMappers.UserRowMapper;
import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;

@Repository
public class UserDAO {

    private final JdbcTemplate jdbcTemplate;



    @Autowired
    public UserDAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int save(User user) {
        String sql = "INSERT INTO User (Name, UserName, Email, PhoneNum, Password, ProfilePicture) VALUES (?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql,
                user.getName(),
                user.getUserName(),
                user.getEmail(),
                user.getPhoneNum(),
                user.getPassword(),
                user.getProfilePicture());
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM User WHERE Email = ?";
        return jdbcTemplate.query(sql, new Object[]{email}, new UserRowMapper())
                .stream().findFirst();
    }

    public Optional<User> findById(int id) {
        String sql = "SELECT * FROM User WHERE UserID = ?";
        return jdbcTemplate.query(sql, new Object[]{id}, new UserRowMapper())
                .stream().findFirst();
    }

    public int update(User user) {
        String sql = "UPDATE User SET Name = ?, UserName = ?, Email = ?, PhoneNum = ?, Password = ?, ProfilePicture = ? WHERE UserID = ?";
        return jdbcTemplate.update(sql,
                user.getName(),
                user.getUserName(),
                user.getEmail(),
                user.getPhoneNum(),
                user.getPassword(),
                user.getProfilePicture(),
                user.getUserId());
    }

    public int delete(int id) {
        String sql = "DELETE FROM User WHERE UserID = ?";
        return jdbcTemplate.update(sql, id);
    }

    public List<User> findAll() {
        String sql = "SELECT * FROM User";
        return jdbcTemplate.query(sql, new UserRowMapper());
    }

    public int updatePassword(int userId, String hashedPassword) {
        String sql = "UPDATE User SET Password = ? WHERE UserID = ?";
        return jdbcTemplate.update(sql, hashedPassword, userId);
    }
}