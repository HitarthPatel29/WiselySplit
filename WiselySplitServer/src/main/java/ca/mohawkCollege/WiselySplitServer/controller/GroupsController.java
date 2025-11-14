package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.service.GroupsService;
import ca.mohawkCollege.WiselySplitServer.service.InviteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupsController {

    @Autowired
    private GroupsService groupsService;

    @Autowired
    private InviteService inviteService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getGroupsForUser(@PathVariable int userId) {
        try {
            List<Map<String, Object>> groups = groupsService.getGroupsForUser(userId);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/{groupId}/details")
    public ResponseEntity<?> getGroupDetails(
            @PathVariable int groupId,
            @RequestParam int userId) {
        try {
            Map<String, Object> groupData = groupsService.getGroupDetails(groupId, userId);
            return ResponseEntity.ok(groupData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/create", consumes = "multipart/form-data")
    public ResponseEntity<?> createGroup(
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestParam("creatorId") int creatorId,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {
        try {
            Map<String, Object> result = groupsService.createGroup(name, type, creatorId, photo);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error creating group: " + e.getMessage()));
        }
    }

    // Update group info + optional photo (combined endpoint)
    @PutMapping(value = "/{groupId}", consumes = "multipart/form-data")
    public ResponseEntity<?> updateGroup(
            @PathVariable int groupId,
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {
        try {
            Map<String, Object> result = groupsService.updateGroup(groupId, name, type, photo);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error updating group: " + e.getMessage()));
        }
    }

    // Leave a group
    @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @PathVariable int groupId,
            @RequestParam int userId
    ) {
        try {
            groupsService.leaveGroup(groupId, userId);
            return ResponseEntity.ok(Map.of("message", "You have left the group."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error leaving group: " + e.getMessage()));
        }
    }

    // Delete a group
    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(
            @PathVariable int groupId,
            @RequestParam int userId
    ) {
        try {
            groupsService.deleteGroup(groupId, userId);
            return ResponseEntity.ok(Map.of("message", "Group deleted successfully."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error deleting group: " + e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/invite")
    public ResponseEntity<?> inviteToGroup(
            @PathVariable int groupId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            int senderId = (int) body.get("senderId");
            String target = (String) body.get("target");
            String message = inviteService.sendInvite(senderId, target, groupId);

            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}