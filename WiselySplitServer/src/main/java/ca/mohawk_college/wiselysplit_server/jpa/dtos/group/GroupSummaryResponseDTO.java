package ca.mohawk_college.wiselysplit_server.jpa.dtos.group;

import ca.mohawk_college.wiselysplit_server.jpa.constants.GroupType;

import java.math.BigDecimal;

public record GroupSummaryResponseDTO(
        Long groupId,
        String groupName,
        GroupType groupType,
        String profilePicture,
        BigDecimal amountLentOrOwed) {
}
