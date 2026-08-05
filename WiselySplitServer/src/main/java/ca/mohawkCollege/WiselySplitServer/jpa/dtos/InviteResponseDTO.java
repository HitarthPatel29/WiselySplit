package ca.mohawkCollege.wiselySplitServer.jpa.dtos;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteStatus;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteType;
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
