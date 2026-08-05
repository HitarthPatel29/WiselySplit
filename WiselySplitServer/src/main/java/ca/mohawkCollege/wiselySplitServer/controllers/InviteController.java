package ca.mohawkCollege.wiselySplitServer.controllers;

import ca.mohawkCollege.wiselySplitServer.services.user.InviteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invite")
public class InviteController {

    @Autowired
    private InviteService inviteService;

    @PostMapping("/send")
    public ResponseEntity<?> sendInvite(@RequestBody Map<String, Object> body) {
        long senderId = ((Number) body.get("senderId")).longValue();
        String target = (String) body.get("target");
        Long groupId = (body.get("groupId") != null) ? ((Number) body.get("groupId")).longValue() : null;

        try {
            String message = inviteService.sendInvite(senderId, target, groupId);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateInviteStatus(@PathVariable long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        inviteService.updateInviteStatus(id, status);
        return ResponseEntity.ok(Map.of("message", "Status updated to " + status));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getInvitesForUser(@PathVariable long userId) {
        try {
            List<Map<String, Object>> invites = inviteService.getAllInvitesForUser(userId);
            return ResponseEntity.ok(invites);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}