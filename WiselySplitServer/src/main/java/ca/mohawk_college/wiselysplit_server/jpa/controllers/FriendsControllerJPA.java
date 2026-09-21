package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.FriendResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.FriendResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.ResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.services.FriendsServiceJPA;
import ca.mohawk_college.wiselysplit_server.services.user.FriendsService;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/jpa/me/friends")
public class FriendsControllerJPA {

    @Autowired
    private FriendsServiceJPA friendsService;

    @GetMapping
    public ResponseEntity<ResponseDTO> getFriendsList(@AuthenticationPrincipal AuthenticatedUser me) {
        List<FriendResponseForListDTO> friends = friendsService.getFriends(me.getUserId());
        return ResponseDTO.respond(StatusCode.SUCCESS, friends);
    }

    @GetMapping("/{friendId}")
    public ResponseEntity<ResponseDTO> getFriend(
            @AuthenticationPrincipal AuthenticatedUser me,
            @PathVariable long friendId) {
        FriendResponseDTO friendResponse = friendsService.getFriend(me.getUserId(), friendId);
        return ResponseDTO.respond(StatusCode.SUCCESS, friendResponse);
    }
}