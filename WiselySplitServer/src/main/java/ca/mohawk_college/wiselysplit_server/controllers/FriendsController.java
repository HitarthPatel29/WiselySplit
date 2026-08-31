package ca.mohawk_college.wiselysplit_server.controllers;

import ca.mohawk_college.wiselysplit_server.services.user.FriendsService;
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
    public ResponseEntity<?> getFriendsList(@PathVariable long userId) {
        try {
            List<Map<String, Object>> friends = friendsService.getFriendsWithBalances(userId);
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}/{friendId}")
    public ResponseEntity<?> getSharedExpenses(
            @PathVariable long userId,
            @PathVariable long friendId) {
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