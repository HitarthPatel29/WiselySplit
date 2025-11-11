package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.ExpensesDAO;
import ca.mohawkCollege.WiselySplitServer.dao.GroupsDAO;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;


@Service
public class GroupsService {

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
                profilePicture = "https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-group_yhn6xa.webp";
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
            g.put("status", net >= 0 ? "owed" : "owe");
            g.put("subtitle", "Shared Group");
        }
        return groups;
    }

    public Map<String, Object> getGroupDetails(int groupId, int userId) {
        Map<String, Object> groupInfo = groupsDAO.findGroupInfo(groupId);
        List<Map<String, Object>> expenses = groupsDAO.findGroupExpenses(groupId, userId);
        List<Map<String, Object>> membersStanding = groupsDAO.findGroupMemberStandings(groupId, userId);

        // Calculate total net balance for "overallStanding"
        double total = membersStanding.stream()
                .mapToDouble(m -> ((Number) m.get("balance")).doubleValue())
                .sum();

        Map<String, Object> overall = Map.of(
                "text", total >= 0
                        ? String.format("You are Owed $%.2f", total)
                        : String.format("You Owe $%.2f", Math.abs(total)),
                "color", total >= 0 ? "text-emerald-600" : "text-red-500"
        );

        groupInfo.put("overallStanding", overall);
        groupInfo.put("membersStanding", membersStanding);

        return Map.of("group", groupInfo, "expenses", expenses);
    }
}