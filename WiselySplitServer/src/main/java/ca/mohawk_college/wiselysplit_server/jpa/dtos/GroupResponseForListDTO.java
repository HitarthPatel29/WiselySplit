package ca.mohawk_college.wiselysplit_server.jpa.dtos;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;

import java.util.List;

public record GroupResponseForListDTO (Long groupId, String groupName, String groupType, String profilePicture, List<UserResponseForListDTO> participants){}

