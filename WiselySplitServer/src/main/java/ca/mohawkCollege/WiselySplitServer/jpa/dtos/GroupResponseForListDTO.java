package ca.mohawkCollege.wiselySplitServer.jpa.dtos;
import java.util.List;

public record GroupResponseForListDTO (Long groupId, String groupName, String groupType, String profilePicture, List<UserResponseForListDTO> participants){}

