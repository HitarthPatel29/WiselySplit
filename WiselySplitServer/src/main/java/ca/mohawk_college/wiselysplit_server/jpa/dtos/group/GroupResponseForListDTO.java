package ca.mohawk_college.wiselysplit_server.jpa.dtos.group;
import ca.mohawk_college.wiselysplit_server.jpa.constants.GroupType;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;

import java.util.List;

public record GroupResponseForListDTO (Long groupId, String groupName, GroupType groupType, String profilePicture, List<UserResponseForListDTO> participants){}