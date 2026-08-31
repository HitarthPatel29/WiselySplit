package ca.mohawk_college.wiselysplit_server.services.user;

import ca.mohawk_college.wiselysplit_server.daos.FriendsDAO;
import ca.mohawk_college.wiselysplit_server.daos.UserDAO;
import ca.mohawk_college.wiselysplit_server.models.User;
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

    public List<Map<String, Object>> getFriendsWithBalances(long userId) {
        List<Map<String, Object>> results = friendsDAO.findFriendsBalances(userId);
        return results;
    }

    public Map<String, Object> getSharedExpensesBetween(long userId, long friendId) {
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

        /*
        Compute net balance by
        -> Adding friend's share (when user paid) : user lent to friend
        -> Subtracting user's share (when friend paid) : user owe to friend
         */
        double netBalance = expenses.stream()
                .mapToDouble(e -> {
                    List<Map<String, Object>> splitDetails = (List<Map<String, Object>>) e.get("splitDetails");

                    // when user paid
                    if (((Number) e.get("payerId")).longValue() == userId)
                        /* gets friend's share by filtering SplitDetails with friendId, if not found returns 0.00 */
                         return splitDetails.stream()
                                .filter(sd -> ((Number) sd.get("userId")).longValue() == friendId)
                                .map(sd -> ((Number) sd.get("amount")).doubleValue())
                                .findFirst()
                                .orElse(0.0);
                    // when friend paid
                    else
                        /* gets user's share by filtering SplitDetails with userId, if not found returns 0.00 */
                        return -splitDetails.stream()
                                .filter(sd -> ((Number) sd.get("userId")).longValue() == userId)
                                .map(sd -> ((Number) sd.get("amount")).doubleValue())
                                .findFirst()
                                .orElse(0.0);
                }).sum();

        friend.put("netBalance", netBalance);

        // 5. Return combined result
        return Map.of(
                "friend", friend,
                "expenses", expenses,
                "message", "Shared expenses retrieved successfully."
        );
    }
}