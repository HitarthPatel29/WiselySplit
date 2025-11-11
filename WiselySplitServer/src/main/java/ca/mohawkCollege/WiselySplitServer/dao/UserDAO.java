package ca.mohawkCollege.WiselySplitServer.dao;

import ca.mohawkCollege.WiselySplitServer.RowMappers.UserRowMapper;
import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Map;
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

    public Optional<User> findByUsername(String username) {
        String sql = "SELECT * FROM User WHERE LOWER(UserName) = LOWER(?)";
        return jdbcTemplate.query(sql, new Object[]{username}, new UserRowMapper())
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

    public List<Map<String, Object>> findFriendsForUser(int userId) {
        String sql = """
            SELECT DISTINCT u.UserID, u.Name
            FROM User u
            WHERE u.UserID IN (
                SELECT DISTINCT ep.UserID
                FROM ExpenseParticipation ep
                JOIN Expenses e ON e.ExpenseID = ep.ExpenseID
                WHERE e.PayerID = ? OR ep.UserID = ?
                UNION
                SELECT DISTINCT e.PayerID
                FROM Expenses e
                JOIN ExpenseParticipation ep ON ep.ExpenseID = e.ExpenseID
                WHERE ep.UserID = ? OR e.PayerID = ?
            )
            AND u.UserID <> ?
            ORDER BY u.Name
        """;
        return jdbcTemplate.queryForList(sql, userId, userId, userId, userId, userId);
    }

    /** All groups user participates in */
    public List<Map<String, Object>> findGroupsForUser(int userId) {
        String sql = """
            SELECT g.GroupID, g.GroupName
            FROM ExpenseGroups g
            JOIN GroupParticipants gp ON gp.GroupID = g.GroupID
            WHERE gp.UserID = ?
            ORDER BY g.GroupName
        """;
        return jdbcTemplate.queryForList(sql, userId);
    }

    /** Members of a specific group */
    public List<Map<String, Object>> findMembersInGroup(int groupId) {
        String sql = """
            SELECT u.UserID, u.Name
            FROM GroupParticipants gp
            JOIN User u ON gp.UserID = u.UserID
            WHERE gp.GroupID = ?
            ORDER BY u.Name
        """;
        return jdbcTemplate.queryForList(sql, groupId);
    }
}