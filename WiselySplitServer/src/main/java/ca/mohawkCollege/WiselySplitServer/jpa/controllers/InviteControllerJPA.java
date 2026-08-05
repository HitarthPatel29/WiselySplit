package ca.mohawkCollege.wiselySplitServer.jpa.controllers;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteStatus;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.InviteRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.ResponseDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.services.InviteServiceJpa;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jpa/invite")
public class InviteControllerJPA {

    @Autowired
    private InviteServiceJpa inviteService;

    @PostMapping("/send")
    public ResponseEntity<ResponseDTO> sendInvite(@RequestBody InviteRequestDTO inviteRequest) {
        try {
            String message = inviteService.sendInvite(inviteRequest.senderId(), inviteRequest.target(), inviteRequest.groupId());
            //return ResponseEntity.ok(Map.of("message", message));
            return ResponseEntity.ok(ResponseDTO.builder()
                    .data(Map.of("message", message))
                    .StatusCode("0000").build());
        } catch (Exception e) {
            //return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            return ResponseEntity.ok(ResponseDTO.builder()
                    .StatusCode("0001")
                    .statusDescription(e.getMessage()).build());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateInviteStatus(@PathVariable Long id, @RequestParam InviteStatus status ) {
        inviteService.updateInviteStatus(id, status);
        return ResponseEntity.ok(Map.of("message", "Status updated to " + status));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getInvitesForUser(@PathVariable Long userId) {
        try {
            InviteServiceJpa.SentAndReceivedInvitesForUserDTO invites = inviteService.getAllInvitesForUser(userId);
            return ResponseEntity.ok(invites);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}