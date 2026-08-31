package ca.mohawk_college.wiselysplit_server.jpa.dtos.invite;

import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteStatus;
import ca.mohawk_college.wiselysplit_server.jpa.constants.InviteType;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.GroupResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@AllArgsConstructor
@Data
@NoArgsConstructor
public class InviteResponseDTO {
    private Long inviteId;
    private UserResponseForListDTO sender;
    private UserResponseForListDTO receiver;
    private GroupResponseForListDTO group;
    private String receiverEmail;
    private InviteType type;
    private InviteStatus status;
    private Instant createdAt;
    private Instant expiresAt;
    private Long daysAgo;
    private Long daysLeft;
}
