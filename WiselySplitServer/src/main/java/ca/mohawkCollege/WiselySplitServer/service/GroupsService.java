package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.ExpensesDAO;
import ca.mohawkCollege.WiselySplitServer.dao.GroupsDAO;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;


@Service
public class GroupsService {

    @Value("${cloudinary.default_photo_link}")
    private String DEFAULT_PHOTO_LINK;
    @Autowired
    private GroupsDAO groupsDAO;
    @Autowired
    private UserDAO userDAO;
    @Autowired
    private ExpensesDAO expensesDAO;
    @Autowired
    private ImageUploadService imageUploadService;

    @Transactional
    public Map<String, Object> createGroup(String name, String type, int creatorId, MultipartFile photo) {
        if (name == null || name.trim().isEmpty())
            throw new IllegalArgumentException("Group name is required.");

        if (!name.matches("^[a-zA-Z0-9\\s]+$"))
            throw new IllegalArgumentException("Group name must be alphanumeric.");

        // Upload photo if provided
        String profilePicture = null;
        try {
            if (photo != null && !photo.isEmpty()) {
                profilePicture = imageUploadService.uploadProfilePicture(photo);
            } else {
                profilePicture = DEFAULT_PHOTO_LINK;
            }
        } catch (Exception e) {
            throw new RuntimeException("Photo upload failed: " + e.getMessage());
        }

        int groupId = groupsDAO.insertGroup(name.trim(), type, profilePicture);
        groupsDAO.addParticipant(groupId, creatorId);

        return Map.of(
                "groupId", groupId,
                "message", "Group created successfully",
                "name", name,
                "type", type,
                "profilePicture", profilePicture
        );
    }
    public List<Map<String, Object>> getGroupsForUser(int userId) {
        // (existing)
        List<Map<String, Object>> groups = groupsDAO.findGroupsForUser(userId);
        for (Map<String, Object> g : groups) {
            double net = ((Number) g.get("NetBalance")).doubleValue();
            g.put("amount", Math.abs(net));
            g.put("status", net==0? "" : (net > 0 ? "lent" : "owe"));
            g.put("subtitle", "Shared Group");
        }
        return groups;
    }

    public Map<String, Object> getGroupDetails(int groupId, int userId) {
        Map<String, Object> groupInfo = groupsDAO.findGroupInfo(groupId);                    // includes type now
        List<Map<String, Object>> expenses = groupsDAO.findGroupExpenses(groupId, userId);
        List<Map<String, Object>> participants = groupsDAO.findGroupParticipantsWithBalances(groupId, userId);

        return Map.of(
                "group", groupInfo,
                "expenses", expenses,
                "participants", participants
        );
    }

    // Update group (name, type, optional photo)
    @Transactional
    public Map<String, Object> updateGroup(int groupId, String name, String type, MultipartFile photo) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Group name is required.");
        }

        if (!name.matches("^[a-zA-Z0-9\\s]+$")) {
            throw new IllegalArgumentException("Group name must be alphanumeric.");
        }

        // Type validation can be stricter if you only support specific values
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException("Group type is required.");
        }

        String profilePicture = null;
        try {
            if (photo != null && !photo.isEmpty()) {
                // Upload new photo
                profilePicture = imageUploadService.uploadProfilePicture(photo);
            }

        } catch (Exception e) {
            throw new RuntimeException("Photo upload failed: " + e.getMessage());
        }

        // If photo is null, DAO will keep the existing picture
        groupsDAO.updateGroup(groupId, name.trim(), type.trim(), profilePicture);

        Map<String, Object> updatedGroup = groupsDAO.findGroupInfo(groupId);
        return Map.of(
                "message", "Group updated successfully",
                "group", updatedGroup
        );
    }

    // Leave group: only if user's net balance in group is 0
    @Transactional
    public void leaveGroup(int groupId, int userId) {
        if (!groupsDAO.isUserInGroup(groupId, userId)) {
            throw new IllegalArgumentException("You are not a member of this group.");
        }

        double net = groupsDAO.getUserNetBalanceInGroup(groupId, userId);
        if (Math.abs(net) > 0.009) { // small epsilon to avoid float noise
            throw new IllegalStateException("Cannot leave group with unsettled balance: " + net);
        }

        groupsDAO.removeParticipant(groupId, userId);
    }

    // Delete group: only if all members are settled
    @Transactional
    public void deleteGroup(int groupId, int userId) {
        if (!groupsDAO.isUserInGroup(groupId, userId)) {
            throw new IllegalArgumentException("You are not a member of this group.");
        }

        // Optional: if you add an "owner" field, enforce only owner can delete here

        List<Integer> participantIds = groupsDAO.findParticipantIds(groupId);
        for (Integer participantId : participantIds) {
            double net = groupsDAO.getUserNetBalanceInGroup(groupId, participantId);
            if (Math.abs(net) > 0.009) {
                throw new IllegalStateException("Cannot delete group; not all balances are settled.");
            }
        }

        groupsDAO.deleteGroup(groupId);
    }

}