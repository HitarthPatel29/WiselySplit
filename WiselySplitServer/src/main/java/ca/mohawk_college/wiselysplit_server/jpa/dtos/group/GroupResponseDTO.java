package ca.mohawk_college.wiselysplit_server.jpa.dtos.group;

import ca.mohawk_college.wiselysplit_server.jpa.constants.GroupType;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForGroupDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;

import java.util.List;

public record GroupResponseDTO(
        Long groupId,
        String groupName,
        GroupType groupType,
        String profilePicture,
        List<UserResponseForGroupDTO> participants,
        List<ExpenseResponseForListDTO> expenses) {
}
