package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteStatus;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.UserResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Invite;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.InviteRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class InviteServiceJpa {

    @Autowired
    InviteRepo inviteRepo;
    public List<UserResponseForListDTO> getFriendsOfUser(User user){
        List<Invite> acceptedInvitesWithUser = inviteRepo.findAcceptedUserInvitesInvolving(InviteStatus.ACCEPTED, user);
        List<UserResponseForListDTO> friendsOfUser = acceptedInvitesWithUser.stream()
                .map(invite -> invite.getSender().equals(user) ? invite.getReceiver() : invite.getSender())
                .distinct()
                .map(friend -> new UserResponseForListDTO(
                        friend.getUserId(),
                        friend.getName(),
                        friend.getUserName(),
                        friend.getProfilePicture())
                ).toList();
        return friendsOfUser;
    }
}
