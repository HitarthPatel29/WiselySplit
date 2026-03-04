package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.FriendsDAO;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FriendsService {

    @Autowired
    private FriendsDAO friendsDAO;

    @Autowired
    private UserDAO userDAO;

    public List<Map<String, Object>> getFriendsWithBalances(int userId) {
        List<Map<String, Object>> results = friendsDAO.findFriendsBalances(userId);
        return results;
    }

    public Map<String, Object> getSharedExpensesBetween(int userId, int friendId) {
        // 1. Fetch all shared expenses
        List<Map<String, Object>> expenses = friendsDAO.findSharedExpenses(userId, friendId);

        // 2. Fetch friend info safely
        User friendUser = userDAO.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend not found"));

        Map<String, Object> friend = new HashMap<>();
        friend.put("userId", friendUser.getUserId());
        friend.put("name", friendUser.getName());
        friend.put("profilePicture", friendUser.getProfilePicture());

        // 3. Handle case when no expenses exist yet
        if (expenses == null || expenses.isEmpty()) {
            friend.put("netBalance", 0.00);

            return Map.of(
                    "friend", friend,
                    "expenses", List.of(),  // return empty array
                    "message", "No shared expenses found yet."
            );
        }

        // 4. Compute total balance only if expenses exist
        double balance = expenses.stream()
                .mapToDouble(e -> ((Number) e.get("userBalance")).doubleValue())
                .sum();

        friend.put("netBalance", balance);

        // 5. Return combined result
        return Map.of(
                "friend", friend,
                "expenses", expenses,
                "message", "Shared expenses retrieved successfully."
        );
    }
}