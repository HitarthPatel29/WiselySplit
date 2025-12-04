package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.Security.ValidationUtil;
import ca.mohawkCollege.WiselySplitServer.dao.ExpensesDAO;
import ca.mohawkCollege.WiselySplitServer.dao.GroupsDAO;
import ca.mohawkCollege.WiselySplitServer.dao.InviteDAO;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.model.Invite;
import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InviteService {

    @Autowired private InviteDAO inviteDAO;
    @Autowired private UserDAO userDAO;
    @Autowired private EmailServiceMailTrapAPI emailServiceMailTrapAPI;
    @Autowired private GroupsDAO groupsDAO;
    @Autowired private ExpensesDAO expensesDAO;
    @Autowired private ExpensesService expensesService;

    public String sendInvite(int senderId, String input, Integer groupId) {
        Optional<User> senderOpt = userDAO.findById(senderId);
        if (senderOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid sender ID");
        }

        User sender = senderOpt.get();

        //Determine if input is email or username
        boolean isEmail = ValidationUtil.isValidEmail(input);

        Optional<User> receiverOpt;
        String targetEmail = null;

        if (isEmail) {
            receiverOpt = userDAO.findByEmail(input.trim());
            targetEmail = input.trim().toLowerCase();
        } else {
            receiverOpt = userDAO.findByUsername(input.trim());
            if (receiverOpt.isPresent()) {
                targetEmail = receiverOpt.get().getEmail();
            } else {
                throw new IllegalArgumentException("User not found with this username.");
            }
        }

        //  Prevent duplicate pending invites
        if (inviteDAO.existsPending(senderId, targetEmail, groupId)) {
            return "Invite already exists.";
        }

        //  Build the Invite record
        Invite invite = new Invite();
        invite.setSenderId(senderId);
        invite.setReceiverEmail(targetEmail);
        invite.setGroupId(groupId);
        invite.setType(groupId != null ? "GROUP" : "USER");
        invite.setStatus("PENDING");
        invite.setExpiresAt(Timestamp.valueOf(LocalDateTime.now().plusDays(7)));
        if (receiverOpt.isPresent()) {
            invite.setReceiverId(receiverOpt.get().getUserId());
        }

        inviteDAO.create(invite);

        //  Prepare email content (same template for all)
        String subject;
        String message;

        if (groupId != null) {
            subject = "Group Invitation from " + sender.getName();
            message = sender.getName() + " invited you to join a group on WiselySplit.\n\n" +
                    "Sign in to accept the invite: https://wiselysplit.vercel.app/login";
        } else {
            subject = "You’ve been invited on WiselySplit!";
            message = sender.getName() + " invited you to share expenses together on WiselySplit.\n\n" +
                    "Accept your invite here: https://wiselysplit.vercel.app/login";
        }

        //  Send appropriate email based on user existence
        try {
            if (receiverOpt.isPresent()) {
                // Existing user — in-app + email notification
                User receiver = receiverOpt.get();
                emailServiceMailTrapAPI.sendEmail(
                        receiver.getEmail(),
                        subject,
                        message + "\n\nWe thought you'd like a reminder 😊"
                );
                return "In-app invite and email notification sent to " + receiver.getName() + ".";
            } else {
                // Non-existing user — email-only invite
                emailServiceMailTrapAPI.sendEmail(
                        input.trim(),
                        "You're invited to join WiselySplit!",
                        sender.getName() + " invited you to join WiselySplit.\n\n" +
                                "Create your account here: https://wiselysplit.vercel.app/signup"
                );
                return "User Account not found. Email invitation has been sent.";
            }
        } catch (Exception e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        }
    }

    public void updateInviteStatus(int inviteId, String status) {
        inviteDAO.updateStatus(inviteId, status);

        // If invite accepted and type = GROUP, add user to group
        if ("ACCEPTED".equalsIgnoreCase(status)) {
            Map<String, Object> invite = inviteDAO.findById(inviteId);
            if (invite != null && "GROUP".equalsIgnoreCase((String) invite.get("Type"))) {

                Object receiverObj = invite.get("ReceiverID");
                Object groupObj = invite.get("GroupID");

                if (receiverObj != null && groupObj != null) {
                    int receiverId = ((Number) receiverObj).intValue();
                    int groupId = ((Number) groupObj).intValue();
                    groupsDAO.addParticipant(groupId, receiverId);
                }
            } else if (invite != null && "USER".equalsIgnoreCase((String) invite.get("Type"))) {

                Object receiverObj = invite.get("ReceiverID");
                Object senderObj = invite.get("SenderID");

                if (receiverObj != null && senderObj != null) {
                    int receiverId = ((Number) receiverObj).intValue();
                    int senderID = ((Number) senderObj).intValue();
                    System.out.println("reached here");
                    int expenseId = expensesDAO.insertExpense("Fugazi Expense", java.time.LocalDate.now().toString(), "Fugazi", 0, senderID, null, false, null);
                    // Insert participants (both sides)
                    System.out.println(expenseId);
                    expensesDAO.insertExpenseParticipation(expenseId, senderID, 0.0, 1.0);
                    expensesDAO.insertExpenseParticipation(expenseId, receiverId, 0.0, 1.0);
                }
            }
        }
    }

    public List<Map<String, Object>> getAllInvitesForUser(int userId) {

        //Update Invite Status for all the Expired rows in the DB.
        inviteDAO.markExpiredInvites();

        //Fetch Updated List with all required Fields
        List<Map<String, Object>> rows = inviteDAO.findAllForUser(userId);
        LocalDateTime now = LocalDateTime.now();

        for (Map<String, Object> row : rows) {
            Timestamp created = (Timestamp) row.get("CreatedAt");
            Timestamp expires = (Timestamp) row.get("ExpiresAt");
            long daysAgo = ChronoUnit.DAYS.between(created.toLocalDateTime(), now);
            long daysLeft = ChronoUnit.DAYS.between(now, expires.toLocalDateTime());
            row.put("daysAgo", daysAgo);
            row.put("daysLeft", daysLeft);
        }
        return rows;
    }
}