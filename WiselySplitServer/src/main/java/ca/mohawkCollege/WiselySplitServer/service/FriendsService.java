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
        for (Map<String, Object> r : results) {
            double amount = ((Number) r.get("NetBalance")).doubleValue();
            r.put("status", amount > 0 ? "owed" : "owe");
            r.put("amount", Math.abs(amount));
        }
        return results;
    }

    public Map<String, Object> getSharedExpensesBetween(int userId, int friendId) {
        // 1️⃣ Fetch all shared expenses
        List<Map<String, Object>> expenses = friendsDAO.findSharedExpenses(userId, friendId);

        // 2️⃣ Fetch friend info safely
        User friendUser = userDAO.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend not found"));

        Map<String, Object> friend = new HashMap<>();
        friend.put("userId", friendUser.getUserId());
        friend.put("name", friendUser.getName());
        friend.put("profilePicture", friendUser.getProfilePicture());

        // 3️⃣ Handle case when no expenses exist yet
        if (expenses == null || expenses.isEmpty()) {
            friend.put("amount", 0.0);
            friend.put("youOwe", false);

            return Map.of(
                    "friend", friend,
                    "expenses", List.of(),  // return empty array
                    "message", "No shared expenses found yet."
            );
        }

        // 4️⃣ Compute total balance only if expenses exist
        double balance = expenses.stream()
                .mapToDouble(e -> ((Number) e.get("balance")).doubleValue())
                .sum();

        friend.put("amount", Math.abs(balance));
        friend.put("youOwe", balance < 0);

        // 5️⃣ Return combined result
        return Map.of(
                "friend", friend,
                "expenses", expenses,
                "message", "Shared expenses retrieved successfully."
        );
    }
}