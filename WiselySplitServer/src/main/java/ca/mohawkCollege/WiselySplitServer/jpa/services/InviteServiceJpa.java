package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.daos.ExpensesDAO;
import ca.mohawkCollege.wiselySplitServer.daos.GroupsDAO;
import ca.mohawkCollege.wiselySplitServer.exceptions.UserNotFoundException;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteStatus;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteType;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.GroupResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.InviteResponseDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.UserResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.ExpenseGroup;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Invite;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.ExpenseGroupRepo;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.InviteRepo;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.UserRepo;
import ca.mohawkCollege.wiselySplitServer.services.EmailServiceMailTrapAPI;
import ca.mohawkCollege.wiselySplitServer.utilities.auth.ValidationUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class InviteServiceJpa {

    @Autowired private UserRepo userRepo;
    @Autowired private EmailServiceMailTrapAPI emailServiceMailTrapAPI;
    @Autowired private GroupsDAO groupsDAO;
    @Autowired private ExpensesDAO expensesDAO;

    @Autowired private ExpenseGroupRepo groupRepo;
    @Value("${frontend.hosting_url}")
    private String hostingURL;

    @Autowired
    InviteRepo inviteRepo;

    public String sendInvite(Long senderId, String input, Long groupId)  {
        User sender = userRepo.findById(senderId).
                orElseThrow(()-> new UserNotFoundException("User with UserId: "+senderId+" not found"));

        //Determine if input is email or username
        boolean isEmail = ValidationUtil.isValidEmail(input);

        Optional<User> receiver = isEmail ? userRepo.findByEmail(input.trim()) : userRepo.findByUserName(input.trim());

        //Get receiverEmail from DB if input is username.
        String receiverEmail = null;
        if (receiver.isPresent()) receiverEmail = receiver.get().getEmail();
        else if (isEmail) receiverEmail = input.trim();
        else throw new UserNotFoundException("User with username: " + input + " not found");

        //  Prevent duplicate pending invites
        if (inviteRepo.existsBySenderIsAndReceiver_EmailEqualsAndGroup_GroupIdEquals(sender, receiverEmail, groupId)) {
            return "Invite already exists.";
        }

        //  Build the Invite record
        Invite invite = new Invite();
        invite.setSender(sender);
        invite.setReceiverEmail(receiverEmail);
        invite.setType(groupId != null ? InviteType.GROUP : InviteType.USER );
        invite.setStatus(InviteStatus.PENDING);
        invite.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        if (null != groupId){
            ExpenseGroup group = groupRepo.findById(groupId).orElseThrow(() -> new IllegalArgumentException("Group with groupId: "+ groupId +" not found!"));
            invite.setGroup(group);
        }
        receiver.ifPresent(invite::setReceiver);

        inviteRepo.save(invite);

        //  Send appropriate email based on user existence
        if (receiver.isPresent())
            return sendInviteEmailToExistingUser(sender, receiver.get(), groupId);
        else return sendInviteEmailToNonExistingUser(sender, receiverEmail);
    }

    public String sendInviteEmailToExistingUser(User sender, User receiver, Long groupId){

        //  Prepare email content
        String subject;
        String message;

        if (groupId != null) {
            subject = "Group Invitation from " + sender.getName();
            message = sender.getName() + " invited you to join an Expense Sharing group on WiselySplit.\n\n" +
                    "Sign in to accept the invite: " + hostingURL + "/dashboard/invites";
        } else {
            subject = "You’ve been invited on WiselySplit!";
            message = sender.getName() + " invited you to share expenses together on WiselySplit.\n\n" +
                    "Accept your invite here: " + hostingURL + "/dashboard/invites";
        }
        try {
            // Existing user — in-app + email notification
            emailServiceMailTrapAPI.sendEmail(
                    receiver.getEmail(),
                    subject,
                    message + "\n\nWe thought you'd like a reminder 😊"
            );
            return "In-app invite and email notification sent to " + receiver.getName() + ".";
        } catch (Exception e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        }
    }

    public String sendInviteEmailToNonExistingUser(User sender, String receiverEmail){
        try {
            // Existing user — in-app + email notification
            emailServiceMailTrapAPI.sendEmail(
                    receiverEmail,
                    "You're invited to join WiselySplit!",
                    sender.getName() + " invited you to join WiselySplit.\n\n" +
                            "Create your account here: " + hostingURL + "/signup"
            );
            return "User Account not found. Email invitation has been sent to " + receiverEmail;
        } catch (Exception e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        }
    }

    @Transactional
    public void updateInviteStatus(long inviteId, InviteStatus status) {
        inviteRepo.updateStatusByInviteIdIs(status, inviteId);

        // If invite accepted and type = GROUP, add user to group
        if (InviteStatus.ACCEPTED.equals(status)) {
            Invite invite = inviteRepo.findById(inviteId)
                    .orElseThrow(() -> new UserNotFoundException("Invite with inviteId: " + inviteId + " not found"));

            if (invite != null && InviteType.GROUP.equals(invite.getType())) {
                Number receiverObj = invite.getReceiver().getUserId();
                Number groupObj = invite.getGroup().getGroupId();

                if (receiverObj != null && groupObj != null) {
                    int receiverId = receiverObj.intValue();
                    int groupId = groupObj.intValue();
                    groupsDAO.addParticipant(groupId, receiverId);
                }
            } else if (invite != null && InviteType.USER.equals(invite.getType())) {

                Number receiverObj = invite.getReceiver().getUserId();;
                Number senderObj = invite.getSender().getUserId();

                if (receiverObj != null && senderObj != null) {
                    int receiverId = receiverObj.intValue();
                    int senderID = senderObj.intValue();

                    int expenseId = expensesDAO.insertSharedExpense("Fugazi Expense", java.time.LocalDate.now().toString(), "Fugazi", 0, senderID, null, false, null, null);

                    // Insert participants (both sides)
                    expensesDAO.insertExpenseParticipation(expenseId, senderID, 0.0, 1.0);
                    expensesDAO.insertExpenseParticipation(expenseId, receiverId, 0.0, 1.0);
                }
            }
        }
    }

    public record SentAndReceivedInvitesForUserDTO(List<InviteResponseDTO> invitesSent, List<InviteResponseDTO> invitesReceived){}

    @Transactional
    public SentAndReceivedInvitesForUserDTO getAllInvitesForUser(Long userId) {

        //Update Invite Status for all the Expired rows in the DB.
        inviteRepo.updateStatusForExpiredInvites();

        //Fetch Updated List with all required Fields
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with userId: " + userId + " not found"));

        List<InviteResponseDTO> invitesSent = user.getInvitesSent()
                .stream().map(this::inviteToInviteResponseDTO).toList();

        List<InviteResponseDTO> invitesReceived = user.getInvitesReceived()
                .stream().map(this::inviteToInviteResponseDTO).toList();

        return new SentAndReceivedInvitesForUserDTO(invitesSent, invitesReceived);
    }

    public InviteResponseDTO inviteToInviteResponseDTO(Invite invite){
        return new InviteResponseDTO(
                invite.getInviteId(),
                new UserResponseForListDTO(
                        invite.getSender().getUserId(),
                        invite.getSender().getName(),
                        invite.getSender().getUserName(),
                        invite.getSender().getProfilePicture()
                ),
                (null == invite.getReceiver()) ? null : new UserResponseForListDTO(
                        invite.getReceiver().getUserId(),
                        invite.getReceiver().getName(),
                        invite.getReceiver().getUserName(),
                        invite.getReceiver().getProfilePicture()
                ),
                (null == invite.getGroup()) ? null : new GroupResponseForListDTO(
                        invite.getGroup().getGroupId(),
                        invite.getGroup().getGroupName(),
                        invite.getGroup().getGroupType(),
                        invite.getGroup().getProfilePicture(),
                        null
                ),
                invite.getReceiverEmail(),
                invite.getType(),
                invite.getStatus(),
                invite.getCreatedAt(),
                invite.getExpiresAt(),
                Duration.between(invite.getCreatedAt(), Instant.now()).toDays(),
                Duration.between(Instant.now(), invite.getExpiresAt()).toDays()
        );
    }
    
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
