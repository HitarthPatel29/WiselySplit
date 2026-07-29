package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteStatus;
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
    public List<Map<String, Object>> getFriendsOfUser(User user){
        List<Invite> acceptedInvitesWithUser = inviteRepo.findAcceptedUserInvitesInvolving(InviteStatus.ACCEPTED, user);
        List<Map<String, Object>> friendsOfUser = acceptedInvitesWithUser.stream()
                .map(invite -> invite.getSender().equals(user) ? invite.getReceiver() : invite.getSender())
                .distinct()
                .map(friend -> Map.of(
                        "userId", (Object) friend.getUserId(),
                        "name", friend.getName(),
                        "userName", friend.getUserName(),
                        "profilePicture", friend.getProfilePicture()
                )).toList();
        return friendsOfUser;
    }
}
