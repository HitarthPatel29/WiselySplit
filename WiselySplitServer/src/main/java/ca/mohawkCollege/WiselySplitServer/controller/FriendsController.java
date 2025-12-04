package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.service.FriendsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
public class FriendsController {

    @Autowired
    private FriendsService friendsService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getFriendsList(@PathVariable int userId) {
        try {
            List<Map<String, Object>> friends = friendsService.getFriendsWithBalances(userId);
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}/{friendId}")
    public ResponseEntity<?> getSharedExpenses(
            @PathVariable int userId,
            @PathVariable int friendId) {
        try {
            Map<String, Object> result = friendsService.getSharedExpensesBetween(userId, friendId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}