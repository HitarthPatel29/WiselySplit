package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.ResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupCreateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupSummaryResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.group.GroupUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.invite.InviteRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.GroupsServiceJPA;
import ca.mohawk_college.wiselysplit_server.jpa.services.InviteServiceJPA;
import ca.mohawk_college.wiselysplit_server.services.user.GroupsService;
import ca.mohawk_college.wiselysplit_server.services.user.InviteService;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jpa/me/groups")
public class GroupsControllerJPA {

    @Autowired private GroupsServiceJPA groupsService;
    @Autowired private InviteServiceJPA inviteService;

    @GetMapping
    public ResponseEntity<ResponseDTO> getGroupsForUser(@AuthenticationPrincipal AuthenticatedUser me) {
        List<GroupSummaryResponseDTO> groupsForUser = groupsService.getGroupsForUser(me.getUserId());
        return ResponseDTO.respond(StatusCode.SUCCESS, groupsForUser);
    }

    @PreAuthorize("@authz.isGroupMember(#groupId)")
    @GetMapping("/{groupId}/details")
    public ResponseEntity<ResponseDTO> getGroupDetails(
            @AuthenticationPrincipal AuthenticatedUser me,
            @PathVariable long groupId) {
        GroupResponseDTO groupDTO = groupsService.getGroupDetails(groupId, me.getUserId());
        return  ResponseDTO.respond(StatusCode.SUCCESS, groupDTO);
    }

    @PostMapping(value = "/create", consumes = "multipart/form-data")
    public ResponseEntity<ResponseDTO> createGroup(
            @ModelAttribute @Valid GroupCreateRequestDTO groupRequestDTO,
            @AuthenticationPrincipal AuthenticatedUser me) {
        GroupResponseDTO savedGroup = groupsService.createGroup(groupRequestDTO, me.getUserId());
        return ResponseDTO.respond(StatusCode.CREATED, savedGroup);
    }

    // Update group info + optional photo (combined endpoint)
    @PreAuthorize("@authz.isGroupMember(#groupId)")
    @PutMapping(value = "/{groupId}", consumes = "multipart/form-data")
    public ResponseEntity<ResponseDTO> updateGroup(
            @ModelAttribute @Valid GroupUpdateRequestDTO groupRequestDTO,
            @AuthenticationPrincipal AuthenticatedUser me){
        GroupResponseDTO updatedGroup = groupsService.updateGroup(groupRequestDTO);
        return ResponseDTO.respond(StatusCode.UPDATED, updatedGroup);
    }

    // Leave a group
    @PreAuthorize("@authz.isGroupMember(#groupId)")
    @PostMapping("/{groupId}/leave")
    public ResponseEntity<ResponseDTO> leaveGroup(
            @PathVariable long groupId,
            @AuthenticationPrincipal AuthenticatedUser me) {
        groupsService.leaveGroup(groupId, me.getUserId());
        return ResponseDTO.respond(StatusCode.UPDATED);
    }

    // Delete a group
    @PreAuthorize("@authz.isGroupMember(#groupId)")
    @DeleteMapping("/{groupId}")
    public ResponseEntity<ResponseDTO> deleteGroup(
            @AuthenticationPrincipal AuthenticatedUser me,
            @PathVariable long groupId
    ) {
        groupsService.deleteGroup(groupId);
        return ResponseDTO.respond(StatusCode.DELETED);
    }

    @PreAuthorize("@authz.isGroupMember(#inviteRequest.groupId)")
    @PostMapping("/invite")
    public ResponseEntity<ResponseDTO> inviteToGroup(
            @RequestBody InviteRequestDTO inviteRequest,
            @AuthenticationPrincipal AuthenticatedUser me
    ) {
            String message = inviteService.sendInvite(
                    me.getUserId(), inviteRequest.target(), inviteRequest.groupId()
            );
            return ResponseDTO.respond(StatusCode.SUCCESS, message);
    }
}