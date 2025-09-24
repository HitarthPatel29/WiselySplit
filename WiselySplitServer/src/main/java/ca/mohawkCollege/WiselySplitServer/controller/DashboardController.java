package ca.mohawkCollege.WiselySplitServer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getDashboard(@PathVariable int userId) {
        // TODO: Fetch user expenses/groups summary from DB
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("totalOwed", 120.50);
        response.put("totalLent", 300.00);
        response.put("groups", new String[]{"Trip to Toronto", "Family Dinner"});
        return ResponseEntity.ok(response);
    }
}