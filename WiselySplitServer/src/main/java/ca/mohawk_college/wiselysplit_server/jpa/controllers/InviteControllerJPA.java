package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.exceptions.GlobalExceptionHandler;
import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteStatus;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.invite.InviteRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.ResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.InviteServiceJPA;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Reference implementation of the response contract.
 *
 * <p>Note what is absent: there is no {@code try/catch} and no logger. Failures are the service's
 * job to describe, by throwing
 * {@link BusinessException} with a
 * {@link StatusCode}, and
 * {@link GlobalExceptionHandler}'s job to render and
 * log. A controller only maps a successful result onto a success code.
 *
 * <p>Catching here would re-break that: it would swallow the specific code the service chose and
 * flatten every cause back into one generic failure.
 */
@RestController
@RequestMapping("/api/jpa/invite")
public class InviteControllerJPA {

    @Autowired
    private InviteServiceJPA inviteService;

    @PostMapping("/send")
    public ResponseEntity<ResponseDTO> sendInvite(@RequestBody InviteRequestDTO inviteRequest) {
        String message = inviteService.sendInvite(
                inviteRequest.senderId(), inviteRequest.target(), inviteRequest.groupId());

        return ResponseDTO.respond(StatusCode.SUCCESS, Map.of("message", message));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ResponseDTO> updateInviteStatus(@PathVariable Long id, @RequestParam InviteStatus status) {
        inviteService.updateInviteStatus(id, status);

        return ResponseDTO.respond(StatusCode.UPDATED, Map.of("inviteId", id, "status", status));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ResponseDTO> getInvitesForUser(@PathVariable Long userId) {
        InviteServiceJPA.SentAndReceivedInvitesForUserDTO invites = inviteService.getAllInvitesForUser(userId);

        boolean empty = invites.invitesSent().isEmpty() && invites.invitesReceived().isEmpty();
        return ResponseDTO.respond(empty ? StatusCode.NO_RESULTS : StatusCode.SUCCESS, invites);
    }
}
